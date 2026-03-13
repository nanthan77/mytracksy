/**
 * lifeAdminReminder — Scheduled Cloud Function (Gen 1)
 *
 * Runs daily at 8:00 AM Sri Lanka time.
 * Checks all users' life_admin tasks and sends FCM reminders
 * at 30 days, 7 days, and 1 day before due date.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { addColomboDays, getColomboDateKey } from "./timezoneUtils";

// Reminder intervals in days
const REMINDER_DAYS = [30, 7, 1];

// Sri Lankan professional templates
export const SRI_LANKAN_TEMPLATES = [
    {
        id: "slmc_renewal",
        title: "SLMC Annual Renewal",
        category: "professional",
        description: "Sri Lanka Medical Council registration renewal",
        url: "https://srilankmedicalcouncil.org/",
        recurring: "yearly",
        icon: "🏥",
    },
    {
        id: "gmoa_subscription",
        title: "GMOA Subscription",
        category: "professional",
        description: "Government Medical Officers' Association annual subscription",
        recurring: "yearly",
        icon: "👨‍⚕️",
    },
    {
        id: "college_surgeons",
        title: "College of Surgeons Membership",
        category: "professional",
        description: "College of Surgeons of Sri Lanka annual membership",
        recurring: "yearly",
        icon: "🔬",
    },
    {
        id: "college_physicians",
        title: "Ceylon College of Physicians",
        category: "professional",
        description: "Ceylon College of Physicians annual membership fee",
        recurring: "yearly",
        icon: "🩺",
    },
    {
        id: "pgim_exam",
        title: "PGIM Exam Registration",
        category: "professional",
        description: "Postgraduate Institute of Medicine exam registration deadline",
        recurring: "custom",
        icon: "📚",
    },
    {
        id: "uptodate_subscription",
        title: "UpToDate Subscription",
        category: "cme",
        description: "UpToDate medical decision support subscription",
        recurring: "yearly",
        icon: "📖",
    },
    {
        id: "bmj_subscription",
        title: "BMJ Journal Subscription",
        category: "cme",
        description: "British Medical Journal annual subscription",
        recurring: "yearly",
        icon: "📰",
    },
    {
        id: "vehicle_revenue_license",
        title: "Vehicle Revenue License",
        category: "vehicle",
        description: "Annual vehicle revenue license renewal at DMT",
        url: "https://www.motortraffic.gov.lk/",
        recurring: "yearly",
        icon: "🚗",
    },
    {
        id: "vehicle_insurance",
        title: "Vehicle Insurance Renewal",
        category: "vehicle",
        description: "Third party or comprehensive vehicle insurance",
        recurring: "yearly",
        icon: "🛡️",
    },
    {
        id: "leasing_payment",
        title: "Vehicle Leasing Payment",
        category: "finance",
        description: "Monthly vehicle leasing installment",
        recurring: "monthly",
        icon: "💳",
    },
    {
        id: "quarterly_tax_ird",
        title: "Quarterly IRD Tax Payment",
        category: "tax",
        description: "Inland Revenue Department quarterly tax installment (linked to Accountant module)",
        recurring: "quarterly",
        icon: "🧾",
    },
    {
        id: "annual_tax_return",
        title: "Annual Tax Return Filing",
        category: "tax",
        description: "IRD annual income tax return deadline",
        recurring: "yearly",
        icon: "📋",
    },
    {
        id: "clinic_rent",
        title: "Clinic Rent Payment",
        category: "clinic",
        description: "Monthly rent for private dispensary/clinic",
        recurring: "monthly",
        icon: "🏠",
    },
    {
        id: "indemnity_insurance",
        title: "Professional Indemnity Insurance",
        category: "professional",
        description: "Medical malpractice / professional indemnity insurance renewal",
        recurring: "yearly",
        icon: "⚖️",
    },
];

export const lifeAdminReminder = functions
    .region("asia-south1")
    .runWith({
        memory: "256MB",
        timeoutSeconds: 120,
    })
    .pubsub.schedule("0 8 * * *")
    .timeZone("Asia/Colombo")
    .onRun(async () => {
        functions.logger.info("📅 Running Life Admin reminder check...");

        const db = admin.firestore();
        const now = new Date();

        // Build target dates (30, 7, 1 days from now)
        const targetDates = REMINDER_DAYS.map(days => ({
            days,
            key: getColomboDateKey(addColomboDays(now, days)),
        }));

        const usersSnap = await db.collection("users").listDocuments();
        let totalReminders = 0;

        for (const userDoc of usersSnap) {
            const userId = userDoc.id;

            try {
                const userData = (await userDoc.get()).data();
                const fcmToken = userData?.fcm_token;

                if (!fcmToken) continue;

                const tasksSnap = await db
                    .collection(`users/${userId}/life_admin`)
                    .where("status", "==", "pending")
                    .get();

                if (tasksSnap.empty) continue;

                for (const taskDoc of tasksSnap.docs) {
                    const task = taskDoc.data();
                    const dueDate = task.due_date?.toDate?.()
                        || new Date(task.due_date);

                    if (!dueDate || isNaN(dueDate.getTime())) continue;

                    // Check if due date matches any reminder interval
                    const dueDateKey = getColomboDateKey(dueDate);

                    for (const { days, key } of targetDates) {
                        if (dueDateKey === key) {
                            const urgency = days === 1 ? "🔴 TOMORROW"
                                : days === 7 ? "🟠 In 7 days"
                                    : "🟡 In 30 days";

                            const title = days === 1
                                ? `⚠️ Due Tomorrow: ${task.title}`
                                : `📅 Reminder: ${task.title}`;

                            const body = days === 1
                                ? `${task.title} is due TOMORROW! Don't forget to complete this.`
                                : `${urgency}: ${task.title} is due on ${dueDate.toLocaleDateString("en-LK")}.`;

                            await admin.messaging().send({
                                token: fcmToken,
                                notification: { title, body },
                                data: {
                                    type: "life_admin_reminder",
                                    taskId: taskDoc.id,
                                    daysUntilDue: String(days),
                                    url: task.url || "",
                                },
                                android: {
                                    priority: days === 1 ? "high" : "normal",
                                },
                            });

                            totalReminders++;
                            functions.logger.info(`📬 Sent ${days}-day reminder for "${task.title}" to ${userId}`);
                        }
                    }
                }
            } catch (err) {
                functions.logger.error(`Failed to process life admin for ${userId}:`, err);
            }
        }

        functions.logger.info(`📅 Life Admin complete: ${totalReminders} reminders sent.`);
        return null;
    });
