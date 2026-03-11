import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// ============================================
// PayHere Configuration
// ============================================
const PAYHERE_MERCHANT_ID = functions.config().payhere?.merchant_id || 'MERCHANT_ID';
const PAYHERE_APP_SECRET = functions.config().payhere?.app_secret || 'APP_SECRET';
const PAYHERE_APP_ID = functions.config().payhere?.app_id || 'APP_ID';
const PAYHERE_CHARGE_URL = 'https://www.payhere.lk/pay/api/charging/charge';
const PAYHERE_TOKEN_URL = 'https://www.payhere.lk/pay/api/v1/oauth/token';

// Token package mapping
const TOKEN_PACKAGES: Record<string, { tokens: number; price_lkr: number; label: string }> = {
  pack_50: { tokens: 50, price_lkr: 750, label: '50 AI Tokens' },
  pack_100: { tokens: 100, price_lkr: 1500, label: '100 AI Tokens' },
  pack_250: { tokens: 250, price_lkr: 3500, label: '250 AI Tokens' },
  pack_500: { tokens: 500, price_lkr: 6500, label: '500 AI Tokens' },
  pack_1000: { tokens: 1000, price_lkr: 12000, label: '1,000 AI Tokens' },
};

// ============================================
// 1. PayHere Pre-Approval Webhook
//    Saves the customer_token when doctor
//    first links their card via web portal
// ============================================
export const handlePayHerePreapproval = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      customer_token,
      custom_1, // Contains userId
      card_holder_name,
      card_no, // Masked card number e.g., "************1234"
      card_expiry,
    } = req.body;

    // Step 1: Validate MD5 signature to prevent spoofing
    const localMd5 = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        crypto.createHash('md5').update(PAYHERE_APP_SECRET).digest('hex').toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    if (localMd5 !== md5sig?.toUpperCase()) {
      console.error('[PayHere Webhook] MD5 signature mismatch — possible spoofing attempt');
      res.status(403).send('Invalid signature');
      return;
    }

    const userId = custom_1;
    if (!userId) {
      console.error('[PayHere Webhook] Missing userId in custom_1');
      res.status(400).send('Missing userId');
      return;
    }

    // Step 2: Check if pre-approval was successful
    if (String(status_code) === '2') {
      // SUCCESS — Save the customer_token securely
      const maskedCard = card_no ? `${card_no.slice(-8)}` : 'Card saved';
      const cardType = card_no?.startsWith('4') ? 'Visa' : card_no?.startsWith('5') ? 'Mastercard' : 'Card';

      await db.doc(`users/${userId}/payment_methods/payhere_card`).set({
        customer_token: customer_token,
        masked_card: `${cardType} •••• ${card_no?.slice(-4) || '****'}`,
        card_type: cardType,
        card_holder_name: card_holder_name || '',
        card_expiry: card_expiry || '',
        auto_reload_enabled: false,
        auto_reload_threshold: 10,
        auto_reload_package: 'pack_100',
        linked_at: admin.firestore.FieldValue.serverTimestamp(),
        last_charged_at: null,
        status: 'active',
      }, { merge: true });

      // Log the initial top-up transaction
      const pkg = TOKEN_PACKAGES[req.body.custom_2 || 'pack_100'];
      if (pkg) {
        await db.runTransaction(async (txn) => {
          const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
          const walletSnap = await txn.get(walletRef);
          const currentTokens = walletSnap.exists ? (walletSnap.data()?.ai_tokens || 0) : 0;
          const currentSpend = walletSnap.exists ? (walletSnap.data()?.total_lifetime_spend_lkr || 0) : 0;

          txn.set(walletRef, {
            ai_tokens: currentTokens + pkg.tokens,
            total_lifetime_spend_lkr: currentSpend + pkg.price_lkr,
            last_topup_at: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // Accounting log — tax-deductible software expense
          const txnRef = db.collection(`users/${userId}/transactions`).doc();
          txn.set(txnRef, {
            type: 'expense',
            category: 'Software & AI Tools',
            description: `MyTracksy ${pkg.label} — Digital Token Top-Up`,
            amount: pkg.price_lkr,
            date: new Date().toISOString().split('T')[0],
            taxDeductible: true,
            taxCategory: 'business_software',
            paymentMethod: 'payhere_card',
            payhere_payment_id: payment_id,
            createdAt: Date.now(),
            sync_status: 'synced',
          });
        });
      }

      console.log(`[PayHere Webhook] Card saved for user ${userId}: ${cardType} •••• ${card_no?.slice(-4)}`);
      res.status(200).send('Card token saved successfully');
    } else {
      console.warn(`[PayHere Webhook] Pre-approval failed with status ${status_code} for user ${userId}`);
      res.status(200).send('Pre-approval not successful');
    }
  } catch (error) {
    console.error('[PayHere Webhook] Error:', error);
    res.status(500).send('Internal server error');
  }
});


// ============================================
// 2. One-Click Top-Up (Callable Function)
//    Doctor taps "Buy Now" in the app
//    Charges saved card instantly via PayHere
// ============================================
export const oneClickTopUp = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { packageId } = data;

  // Validate package
  const pkg = TOKEN_PACKAGES[packageId];
  if (!pkg) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid package: ${packageId}`);
  }

  // Fetch saved card token
  const cardDoc = await db.doc(`users/${userId}/payment_methods/payhere_card`).get();
  if (!cardDoc.exists || !cardDoc.data()?.customer_token) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No saved payment card. Please link your card at wallet.mytracksy.lk first.'
    );
  }

  const customerToken = cardDoc.data()!.customer_token;

  try {
    // Step 1: Get PayHere access token
    const fetch = (await import('node-fetch')).default;
    
    const tokenResponse = await fetch(PAYHERE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&app_id=${PAYHERE_APP_ID}&app_secret=${PAYHERE_APP_SECRET}`,
    });
    const tokenData = await tokenResponse.json() as any;

    if (!tokenData.access_token) {
      throw new Error('Failed to obtain PayHere access token');
    }

    // Step 2: Charge the saved card
    const orderId = `topup_${userId}_${Date.now()}`;
    const chargeResponse = await fetch(PAYHERE_CHARGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'CHARGING',
        order_id: orderId,
        items: pkg.label,
        currency: 'LKR',
        amount: pkg.price_lkr,
        customer_token: customerToken,
      }),
    });
    const chargeData = await chargeResponse.json() as any;

    if (chargeData.status !== 1 && chargeData.status_code !== 2) {
      // Card declined or error
      if (chargeData.status === -1 || chargeData.msg?.includes('declined')) {
        // Disable auto-reload if card is declining
        await db.doc(`users/${userId}/payment_methods/payhere_card`).update({
          auto_reload_enabled: false,
          last_error: chargeData.msg || 'Card declined',
          last_error_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      throw new functions.https.HttpsError('aborted', chargeData.msg || 'Payment failed');
    }

    // Step 3: Add tokens via Firestore Transaction (atomic)
    await db.runTransaction(async (txn) => {
      const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
      const walletSnap = await txn.get(walletRef);
      const currentTokens = walletSnap.exists ? (walletSnap.data()?.ai_tokens || 0) : 0;
      const currentSpend = walletSnap.exists ? (walletSnap.data()?.total_lifetime_spend_lkr || 0) : 0;

      // a) Update wallet balance
      txn.set(walletRef, {
        ai_tokens: currentTokens + pkg.tokens,
        total_lifetime_spend_lkr: currentSpend + pkg.price_lkr,
        last_topup_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // b) Accounting auto-log — tax-deductible software expense
      const txnRef = db.collection(`users/${userId}/transactions`).doc();
      txn.set(txnRef, {
        type: 'expense',
        category: 'Software & AI Tools',
        description: `MyTracksy ${pkg.label} — 1-Click Top-Up`,
        amount: pkg.price_lkr,
        date: new Date().toISOString().split('T')[0],
        taxDeductible: true,
        taxCategory: 'business_software',
        paymentMethod: 'payhere_saved_card',
        payhere_order_id: orderId,
        createdAt: Date.now(),
        sync_status: 'synced',
      });

      // c) Update last charged timestamp on card
      const cardRef = db.doc(`users/${userId}/payment_methods/payhere_card`);
      txn.update(cardRef, { last_charged_at: admin.firestore.FieldValue.serverTimestamp() });
    });

    console.log(`[1-Click TopUp] User ${userId} purchased ${pkg.tokens} tokens for LKR ${pkg.price_lkr}`);

    return {
      success: true,
      tokens_added: pkg.tokens,
      amount_charged: pkg.price_lkr,
      order_id: orderId,
      message: `${pkg.tokens} tokens added to your wallet! Tax receipt generated.`,
    };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('[1-Click TopUp] Error:', error);
    throw new functions.https.HttpsError('internal', 'Payment processing error. Please try again.');
  }
});


// ============================================
// 3. Auto-Reload Cron Job (Every Hour)
//    Checks all users with auto-reload ON
//    and balance below threshold
// ============================================
export const processAutoReloads = functions.pubsub
  .schedule('every 60 minutes')
  .timeZone('Asia/Colombo')
  .onRun(async () => {
    console.log('[Auto-Reload] Starting hourly auto-reload check...');

    try {
      // Query all users with auto-reload enabled
      const cardSnapshots = await db.collectionGroup('payment_methods')
        .where('auto_reload_enabled', '==', true)
        .where('status', '==', 'active')
        .get();

      if (cardSnapshots.empty) {
        console.log('[Auto-Reload] No users with auto-reload enabled');
        return null;
      }

      let processed = 0;
      let charged = 0;
      let failed = 0;

      for (const cardDoc of cardSnapshots.docs) {
        // Extract userId from path: users/{userId}/payment_methods/payhere_card
        const pathParts = cardDoc.ref.path.split('/');
        const userId = pathParts[1];
        const cardData = cardDoc.data();
        const threshold = cardData.auto_reload_threshold || 10;
        const reloadPackage = cardData.auto_reload_package || 'pack_100';

        // Check wallet balance
        const walletSnap = await db.doc(`users/${userId}/wallet/current_balance`).get();
        const currentTokens = walletSnap.exists ? (walletSnap.data()?.ai_tokens || 0) : 0;

        if (currentTokens < threshold) {
          const pkg = TOKEN_PACKAGES[reloadPackage];
          if (!pkg) continue;

          console.log(`[Auto-Reload] User ${userId}: ${currentTokens} tokens < ${threshold} threshold. Charging LKR ${pkg.price_lkr}...`);

          try {
            const fetch = (await import('node-fetch')).default;

            // Get PayHere access token
            const tokenResponse = await fetch(PAYHERE_TOKEN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `grant_type=client_credentials&app_id=${PAYHERE_APP_ID}&app_secret=${PAYHERE_APP_SECRET}`,
            });
            const tokenData = await tokenResponse.json() as any;

            if (!tokenData.access_token) {
              console.error(`[Auto-Reload] Failed to get PayHere token for user ${userId}`);
              failed++;
              continue;
            }

            // Charge saved card
            const orderId = `auto_${userId}_${Date.now()}`;
            const chargeResponse = await fetch(PAYHERE_CHARGE_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'CHARGING',
                order_id: orderId,
                items: `Auto-Reload: ${pkg.label}`,
                currency: 'LKR',
                amount: pkg.price_lkr,
                customer_token: cardData.customer_token,
              }),
            });
            const chargeData = await chargeResponse.json() as any;

            if (chargeData.status === 1 || chargeData.status_code === 2) {
              // SUCCESS — Add tokens
              await db.runTransaction(async (txn) => {
                const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
                const snap = await txn.get(walletRef);
                const tokens = snap.exists ? (snap.data()?.ai_tokens || 0) : 0;
                const spend = snap.exists ? (snap.data()?.total_lifetime_spend_lkr || 0) : 0;

                txn.set(walletRef, {
                  ai_tokens: tokens + pkg.tokens,
                  total_lifetime_spend_lkr: spend + pkg.price_lkr,
                  last_topup_at: admin.firestore.FieldValue.serverTimestamp(),
                  last_auto_reload_at: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                // Tax-deductible accounting log
                const txnRef = db.collection(`users/${userId}/transactions`).doc();
                txn.set(txnRef, {
                  type: 'expense',
                  category: 'Software & AI Tools',
                  description: `MyTracksy ${pkg.label} — Auto-Reload`,
                  amount: pkg.price_lkr,
                  date: new Date().toISOString().split('T')[0],
                  taxDeductible: true,
                  taxCategory: 'business_software',
                  paymentMethod: 'payhere_auto_reload',
                  payhere_order_id: orderId,
                  createdAt: Date.now(),
                  sync_status: 'synced',
                });
              });

              // Send FCM push notification
              try {
                const userDoc = await db.doc(`users/${userId}`).get();
                const fcmToken = userDoc.data()?.fcm_token;
                if (fcmToken) {
                  await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                      title: '⚡ Wallet Auto-Reloaded',
                      body: `${pkg.tokens} AI Tokens added. Tax receipt generated.`,
                    },
                    data: {
                      type: 'auto_reload',
                      tokens: String(pkg.tokens),
                      amount: String(pkg.price_lkr),
                    },
                  });
                }
              } catch (fcmErr) {
                console.warn(`[Auto-Reload] FCM notification failed for ${userId}:`, fcmErr);
              }

              charged++;
              console.log(`[Auto-Reload] ✅ User ${userId}: +${pkg.tokens} tokens (LKR ${pkg.price_lkr})`);
            } else {
              // Card declined — disable auto-reload
              await db.doc(`users/${userId}/payment_methods/payhere_card`).update({
                auto_reload_enabled: false,
                last_error: chargeData.msg || 'Card declined during auto-reload',
                last_error_at: admin.firestore.FieldValue.serverTimestamp(),
              });

              // Notify user to update card
              try {
                const userDoc = await db.doc(`users/${userId}`).get();
                const fcmToken = userDoc.data()?.fcm_token;
                if (fcmToken) {
                  await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                      title: '⚠️ Auto-Reload Failed',
                      body: 'Your card was declined. Please update your payment method at wallet.mytracksy.lk',
                    },
                  });
                }
              } catch {}

              failed++;
              console.log(`[Auto-Reload] ❌ User ${userId}: Card declined`);
            }
          } catch (err) {
            console.error(`[Auto-Reload] Error processing user ${userId}:`, err);
            failed++;
          }
        }

        processed++;
      }

      console.log(`[Auto-Reload] Complete: ${processed} checked, ${charged} charged, ${failed} failed`);
      return null;
    } catch (error) {
      console.error('[Auto-Reload] Cron job error:', error);
      return null;
    }
  });


// ============================================
// 4. Spend Tokens (Callable Function)
//    Deducts tokens when doctor uses AI feature
// ============================================
export const spendTokens = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { amount, feature, description } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid token amount');
  }

  return db.runTransaction(async (txn) => {
    const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
    const snap = await txn.get(walletRef);
    const currentTokens = snap.exists ? (snap.data()?.ai_tokens || 0) : 0;

    if (currentTokens < amount) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Insufficient tokens. Balance: ${currentTokens}, Required: ${amount}`
      );
    }

    txn.update(walletRef, {
      ai_tokens: currentTokens - amount,
      last_spent_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log the spend
    const spendRef = db.collection(`users/${userId}/wallet_transactions`).doc();
    txn.set(spendRef, {
      type: 'spend',
      tokens: -amount,
      feature: feature || 'ai_general',
      description: description || `AI feature usage`,
      createdAt: Date.now(),
    });

    return {
      success: true,
      remaining_tokens: currentTokens - amount,
    };
  });
});
