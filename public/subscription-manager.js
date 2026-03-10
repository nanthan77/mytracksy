// MyTracksy Subscription & Feature Management System
// Version: 1.0.0

class SubscriptionManager {
    constructor() {
        this.tiers = {
            starter: {
                name: 'Starter',
                price: 0,
                tagline: 'Perfect for getting started',
                features: ['expense_tracking', 'basic_tax_calculator', 'financial_reports', 'mobile_app_access', 'email_support'],
                limits: {
                    transactions: 100,
                    bankAccounts: 2,
                    companies: 0,
                    employees: 0,
                    storage: 500,
                    reports: 3,
                    taxCalculations: 10
                },
                color: '#6b7280',
                icon: '🆓',
                popular: false,
                savings: null
            },
            personal: {
                name: 'Personal Pro',
                price: 390,
                tagline: 'Everything you need for personal finance',
                features: ['unlimited_transactions', 'advanced_tax_calculator', 'investment_tracking', 'automated_categorization', 'custom_reports', 'data_export', 'mobile_app_premium', 'priority_email_support', 'tax_filing_assistance'],
                limits: {
                    transactions: -1,
                    bankAccounts: 10,
                    companies: 0,
                    employees: 0,
                    storage: 5000,
                    reports: -1,
                    taxCalculations: -1
                },
                color: '#10b981',
                icon: '👤',
                popular: true,
                savings: 'Save 2 hours/week on financial management'
            },
            business: {
                name: 'Business Starter',
                price: 1200,
                tagline: 'Perfect for small businesses & freelancers',
                features: ['all_personal_features', 'business_expense_tracking', 'employee_management', 'payroll_basic', 'vat_management', 'invoice_generation', 'business_reports', 'tax_compliance', 'phone_support', 'accountant_collaboration'],
                limits: {
                    transactions: -1,
                    bankAccounts: -1,
                    companies: 1,
                    employees: 5,
                    storage: 20000,
                    reports: -1,
                    invoices: 100,
                    vatReturns: 12
                },
                color: '#3b82f6',
                icon: '🏢',
                popular: false,
                savings: 'Save 5 hours/week on business admin'
            },
            professional: {
                name: 'Professional',
                price: 2500,
                tagline: 'For growing businesses & professionals',
                features: ['all_business_features', 'unlimited_employees', 'advanced_payroll', 'multi_company_management', 'advanced_analytics', 'api_access', 'custom_integrations', 'dedicated_support', 'training_sessions', 'tax_expert_consultation', 'white_label_reports'],
                limits: {
                    transactions: -1,
                    bankAccounts: -1,
                    companies: 10,
                    employees: -1,
                    storage: -1,
                    reports: -1,
                    invoices: -1,
                    apiCalls: 10000
                },
                color: '#7c3aed',
                icon: '🚀',
                popular: false,
                savings: 'Save 15 hours/week, increase accuracy by 95%'
            }
        };

        // Add-on services for additional revenue
        this.addOns = {
            tax_filing_service: {
                name: 'Tax Filing Service',
                price: 2500,
                duration: 'yearly',
                description: 'Professional tax return preparation and filing',
                icon: '📋'
            },
            accountant_connect: {
                name: 'Accountant Connect',
                price: 500,
                duration: 'monthly',
                description: 'Connect with verified accountants in Sri Lanka',
                icon: '👨‍💼'
            },
            business_consultation: {
                name: 'Business Consultation',
                price: 1500,
                duration: 'per session',
                description: '1-hour business financial consultation',
                icon: '💼'
            },
            custom_integration: {
                name: 'Custom Integration',
                price: 15000,
                duration: 'one-time',
                description: 'Custom integration with your existing systems',
                icon: '🔗'
            },
            priority_support: {
                name: 'Priority Support',
                price: 300,
                duration: 'monthly',
                description: '2-hour response time guarantee',
                icon: '⚡'
            }
        };

        // Special offers and discounts
        this.specialOffers = {
            annual_discount: {
                name: 'Annual Billing Discount',
                discount: 20,
                description: 'Save 20% when you pay annually'
            },
            student_discount: {
                name: 'Student Discount',
                discount: 50,
                description: 'Special pricing for university students',
                verification_required: true
            },
            startup_program: {
                name: 'Startup Program',
                discount: 75,
                description: 'Special pricing for new startups',
                duration: 6,
                requirements: 'Company less than 2 years old'
            },
            ngo_discount: {
                name: 'NGO Discount',
                discount: 60,
                description: 'Special pricing for registered NGOs'
            }
        };

        this.usageTracking = {
            transactions: 0,
            bankAccounts: 0,
            companies: 0,
            employees: 0,
            storage: 0,
            lastReset: new Date().toISOString()
        };

        this.init();
    }

    init() {
        // Load existing subscription data
        this.loadSubscriptionData();
        this.loadUsageData();
        this.checkSubscriptionStatus();
        
        // Reset usage if new month
        this.resetMonthlyUsage();
    }

    // Get current user subscription tier
    getUserTier() {
        const subscription = this.getSubscriptionData();
        return subscription.tier || 'starter';
    }

    // Check if user has access to a specific feature
    hasFeatureAccess(feature) {
        const tier = this.getUserTier();
        const tierData = this.tiers[tier];
        
        if (!tierData) return false;
        
        // Check if feature is in the tier's features array
        return tierData.features.includes(feature) || 
               tierData.features.includes('all_features') ||
               tierData.features.includes('all_personal');
    }

    // Check if user has reached usage limits
    checkUsageLimit(type) {
        const tier = this.getUserTier();
        const tierData = this.tiers[tier];
        const usage = this.getUsageData();
        
        if (!tierData || !tierData.limits[type]) return false;
        
        const limit = tierData.limits[type];
        const currentUsage = usage[type] || 0;
        
        // -1 means unlimited
        if (limit === -1) return false;
        
        return currentUsage >= limit;
    }

    // Track usage for a specific action
    trackUsage(type, amount = 1) {
        const usage = this.getUsageData();
        usage[type] = (usage[type] || 0) + amount;
        
        // Update last activity
        usage.lastActivity = new Date().toISOString();
        
        this.saveUsageData(usage);
        
        // Check if limit reached and show upgrade prompt
        if (this.checkUsageLimit(type)) {
            this.showUpgradePrompt(type);
        }
        
        return !this.checkUsageLimit(type);
    }

    // Get remaining usage for a specific type
    getRemainingUsage(type) {
        const tier = this.getUserTier();
        const tierData = this.tiers[tier];
        const usage = this.getUsageData();
        
        if (!tierData || !tierData.limits[type]) return 0;
        
        const limit = tierData.limits[type];
        const currentUsage = usage[type] || 0;
        
        if (limit === -1) return -1; // unlimited
        
        return Math.max(0, limit - currentUsage);
    }

    // Show upgrade prompt when limits are reached
    showUpgradePrompt(limitType) {
        const tier = this.getUserTier();
        const nextTier = this.getNextTier(tier);
        
        if (!nextTier) return;
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-modal-backdrop" onclick="this.parentElement.remove()">
                <div class="upgrade-modal-content" onclick="event.stopPropagation()">
                    <div class="upgrade-header">
                        <h2>🚀 Upgrade Required</h2>
                        <button class="close-btn" onclick="this.closest('.upgrade-modal').remove()">×</button>
                    </div>
                    <div class="upgrade-body">
                        <p>You've reached your ${limitType} limit for the ${this.tiers[tier].name} plan.</p>
                        <div class="upgrade-comparison">
                            <div class="current-plan">
                                <h3>Current: ${this.tiers[tier].name}</h3>
                                <p>LKR ${this.tiers[tier].price}/month</p>
                                <p>${limitType}: ${this.tiers[tier].limits[limitType] === -1 ? 'Unlimited' : this.tiers[tier].limits[limitType]}</p>
                            </div>
                            <div class="recommended-plan">
                                <h3>Recommended: ${this.tiers[nextTier].name}</h3>
                                <p>LKR ${this.tiers[nextTier].price}/month</p>
                                <p>${limitType}: ${this.tiers[nextTier].limits[limitType] === -1 ? 'Unlimited' : this.tiers[nextTier].limits[limitType]}</p>
                            </div>
                        </div>
                        <div class="upgrade-actions">
                            <button class="btn-upgrade" onclick="subscriptionManager.upgradeToTier('${nextTier}')">
                                Upgrade to ${this.tiers[nextTier].name}
                            </button>
                            <button class="btn-secondary" onclick="this.closest('.upgrade-modal').remove()">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addUpgradeModalStyles();
    }

    // Get next tier for upgrade suggestions
    getNextTier(currentTier) {
        const tierOrder = ['starter', 'personal', 'business', 'professional'];
        const currentIndex = tierOrder.indexOf(currentTier);
        
        if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
            return null;
        }
        
        return tierOrder[currentIndex + 1];
    }

    // Get recommended tier based on user profile
    getRecommendedTier(userProfile) {
        if (userProfile && userProfile.type === 'student') {
            return 'personal'; // With student discount
        } else if (userProfile && (userProfile.type === 'business' || userProfile.hasEmployees)) {
            return userProfile.employeeCount > 5 ? 'professional' : 'business';
        } else if (userProfile && userProfile.monthlyTransactions > 100) {
            return 'personal';
        } else {
            return 'starter';
        }
    }

    // Calculate discounted price
    calculateDiscountedPrice(tierKey, userProfile, billingPeriod = 'monthly') {
        const tier = this.tiers[tierKey];
        if (!tier) return 0;
        
        let price = tier.price;

        // Apply annual discount
        if (billingPeriod === 'annual' && price > 0) {
            price = price * 12 * 0.8; // 20% discount for annual billing
        }

        // Apply user-specific discounts
        if (userProfile) {
            if (userProfile.isStudent && this.specialOffers.student_discount) {
                price = price * 0.5; // 50% off for students
            } else if (userProfile.isStartup && this.specialOffers.startup_program) {
                price = price * 0.25; // 75% off for startups
            } else if (userProfile.isNGO && this.specialOffers.ngo_discount) {
                price = price * 0.4; // 60% off for NGOs
            }
        }

        return Math.round(price);
    }

    // Get pricing display with USD conversion
    getPricingDisplay() {
        return Object.keys(this.tiers).map(tierKey => {
            const tier = this.tiers[tierKey];
            return {
                id: tierKey,
                ...tier,
                priceDisplay: tier.price === 0 ? 'Free' : `LKR ${tier.price.toLocaleString()}/month`,
                priceUSD: tier.price === 0 ? 'Free' : `$${(tier.price / 160).toFixed(2)}/month`
            };
        });
    }

    // Upgrade to a specific tier
    upgradeToTier(newTier) {
        if (!this.tiers[newTier]) return;
        
        // Show payment modal
        this.showPaymentModal(newTier);
    }

    // Show payment modal
    showPaymentModal(tier) {
        const tierData = this.tiers[tier];
        
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-backdrop" onclick="this.parentElement.remove()">
                <div class="payment-modal-content" onclick="event.stopPropagation()">
                    <div class="payment-header">
                        <h2>💳 Subscribe to ${tierData.name}</h2>
                        <button class="close-btn" onclick="this.closest('.payment-modal').remove()">×</button>
                    </div>
                    <div class="payment-body">
                        <div class="plan-summary">
                            <h3>${tierData.name}</h3>
                            <p class="price">LKR ${tierData.price}/month</p>
                            <ul class="features-list">
                                ${tierData.features.map(f => `<li>✅ ${f.replace('_', ' ').toUpperCase()}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="payment-methods">
                            <h4>Choose Payment Method:</h4>
                            <button class="payment-btn" onclick="subscriptionManager.processPayment('${tier}', 'payhere')">
                                <img src="https://www.payhere.lk/downloads/images/payhere_logo.png" alt="PayHere" style="height: 30px;">
                                PayHere
                            </button>
                            <button class="payment-btn" onclick="subscriptionManager.processPayment('${tier}', 'stripe')">
                                <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe" style="height: 30px;">
                                International Cards
                            </button>
                            <button class="payment-btn" onclick="subscriptionManager.processPayment('${tier}', 'bank')">
                                🏦 Bank Transfer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addPaymentModalStyles();
    }

    // Process payment
    processPayment(tier, method) {
        const tierData = this.tiers[tier];
        
        // Show loading
        this.showPaymentLoading();
        
        // Simulate payment processing
        setTimeout(() => {
            // For demo purposes, we'll simulate successful payment
            this.simulateSuccessfulPayment(tier);
        }, 2000);
    }

    // Simulate successful payment (replace with real payment integration)
    simulateSuccessfulPayment(tier) {
        // Update subscription
        const subscription = {
            tier: tier,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            paymentMethod: 'demo',
            transactionId: 'demo_' + Date.now()
        };
        
        this.saveSubscriptionData(subscription);
        
        // Reset usage
        this.resetUsage();
        
        // Show success message
        this.showPaymentSuccess(tier);
        
        // Remove modals
        document.querySelectorAll('.payment-modal, .upgrade-modal').forEach(modal => {
            modal.remove();
        });
        
        // Refresh the page to apply new features
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // Show payment success message
    showPaymentSuccess(tier) {
        const tierData = this.tiers[tier];
        
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <h3>🎉 Welcome to ${tierData.name}!</h3>
                <p>Your subscription is now active. Enjoy your new features!</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Show payment loading
    showPaymentLoading() {
        const loader = document.createElement('div');
        loader.className = 'payment-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>Processing payment...</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        
        setTimeout(() => {
            loader.remove();
        }, 3000);
    }

    // Reset monthly usage
    resetMonthlyUsage() {
        const usage = this.getUsageData();
        const lastReset = new Date(usage.lastReset);
        const now = new Date();
        
        // Check if it's a new month
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
            this.resetUsage();
        }
    }

    // Reset usage data
    resetUsage() {
        const usage = {
            transactions: 0,
            bankAccounts: 0,
            companies: 0,
            employees: 0,
            storage: 0,
            lastReset: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        this.saveUsageData(usage);
    }

    // Check subscription status
    checkSubscriptionStatus() {
        const subscription = this.getSubscriptionData();
        
        if (!subscription.endDate) return;
        
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        
        // Check if subscription expired
        if (endDate < now) {
            this.handleExpiredSubscription();
        }
        
        // Check if expiring soon (7 days)
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            this.showRenewalReminder(daysUntilExpiry);
        }
    }

    // Handle expired subscription
    handleExpiredSubscription() {
        // Downgrade to free tier
        const subscription = this.getSubscriptionData();
        subscription.tier = 'free';
        subscription.status = 'expired';
        
        this.saveSubscriptionData(subscription);
        
        // Show expiration notice
        this.showExpirationNotice();
    }

    // Show renewal reminder
    showRenewalReminder(daysLeft) {
        const reminder = document.createElement('div');
        reminder.className = 'renewal-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <h4>⏰ Subscription Expiring Soon</h4>
                <p>Your subscription expires in ${daysLeft} days</p>
                <button onclick="subscriptionManager.renewSubscription()">Renew Now</button>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(reminder);
    }

    // Data persistence methods
    getSubscriptionData() {
        return JSON.parse(localStorage.getItem('mytracksy_subscription') || '{"tier": "starter", "status": "active"}');
    }

    saveSubscriptionData(data) {
        localStorage.setItem('mytracksy_subscription', JSON.stringify(data));
    }

    getUsageData() {
        return JSON.parse(localStorage.getItem('mytracksy_usage') || '{"transactions": 0, "bankAccounts": 0, "companies": 0, "employees": 0, "storage": 0, "lastReset": "' + new Date().toISOString() + '"}');
    }

    saveUsageData(data) {
        localStorage.setItem('mytracksy_usage', JSON.stringify(data));
    }

    loadSubscriptionData() {
        // Load from localStorage (in production, this would be from server)
        this.subscriptionData = this.getSubscriptionData();
    }

    loadUsageData() {
        // Load from localStorage (in production, this would be from server)
        this.usageTracking = this.getUsageData();
    }

    // Add CSS styles for modals
    addUpgradeModalStyles() {
        if (document.getElementById('upgrade-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'upgrade-modal-styles';
        styles.textContent = `
            .upgrade-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            
            .upgrade-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            }
            
            .upgrade-modal-content {
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2rem;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .upgrade-header h2 {
                margin: 0;
                color: #1e293b;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: #64748b;
            }
            
            .upgrade-body {
                padding: 2rem;
            }
            
            .upgrade-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin: 1.5rem 0;
            }
            
            .current-plan, .recommended-plan {
                padding: 1.5rem;
                border-radius: 12px;
                text-align: center;
            }
            
            .current-plan {
                background: #f1f5f9;
                border: 2px solid #e2e8f0;
            }
            
            .recommended-plan {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: 2px solid #667eea;
            }
            
            .upgrade-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .btn-upgrade {
                flex: 1;
                background: #10b981;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-upgrade:hover {
                background: #059669;
                transform: translateY(-2px);
            }
            
            .btn-secondary {
                flex: 1;
                background: #f1f5f9;
                color: #64748b;
                border: 2px solid #e2e8f0;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-secondary:hover {
                background: #e2e8f0;
            }
        `;
        
        document.head.appendChild(styles);
    }

    addPaymentModalStyles() {
        if (document.getElementById('payment-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'payment-modal-styles';
        styles.textContent = `
            .payment-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10001;
            }
            
            .payment-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            }
            
            .payment-modal-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .payment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2rem;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .payment-body {
                padding: 2rem;
            }
            
            .plan-summary {
                text-align: center;
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
            }
            
            .plan-summary .price {
                font-size: 2rem;
                font-weight: 800;
                margin: 1rem 0;
            }
            
            .features-list {
                list-style: none;
                padding: 0;
                margin: 1rem 0;
            }
            
            .features-list li {
                padding: 0.5rem 0;
                text-align: left;
            }
            
            .payment-methods h4 {
                margin-bottom: 1rem;
                color: #1e293b;
            }
            
            .payment-btn {
                display: flex;
                align-items: center;
                gap: 1rem;
                width: 100%;
                padding: 1rem;
                margin-bottom: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .payment-btn:hover {
                border-color: #667eea;
                background: #f8fafc;
            }
            
            .payment-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
            }
            
            .loader-content {
                background: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .payment-success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 10003;
                animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .renewal-reminder {
                position: fixed;
                top: 70px;
                right: 20px;
                background: #f59e0b;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 10003;
                max-width: 300px;
            }
            
            .reminder-content {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .reminder-content button {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Utility methods for easy integration
    static createInstance() {
        return new SubscriptionManager();
    }
}

// Initialize global subscription manager
const subscriptionManager = new SubscriptionManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionManager;
}