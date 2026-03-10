// MyTracksy New Monetization Strategy
// Version: 2.0.0 - Redesigned for Sri Lankan Market

class NewMonetizationStrategy {
    constructor() {
        this.newTiers = {
            // FREEMIUM MODEL - Hook users with value first
            starter: {
                name: 'Starter',
                price: 0,
                duration: 'lifetime',
                tagline: 'Perfect for getting started',
                features: [
                    'expense_tracking',      // Up to 100 transactions/month
                    'basic_tax_calculator',  // Simple income tax calculations
                    'financial_reports',     // Basic monthly reports
                    'mobile_app_access',     // Access to mobile features
                    'email_support'          // Email support only
                ],
                limits: {
                    transactions: 100,      // 100 per month (good for personal use)
                    bankAccounts: 2,        // 2 bank accounts
                    companies: 0,           // No business features
                    employees: 0,
                    storage: 500,           // 500MB storage
                    reports: 3,             // 3 reports per month
                    taxCalculations: 10     // 10 tax calculations per month
                },
                color: '#6b7280',
                icon: '🆓',
                popular: false
            },

            // VALUE-FOCUSED PERSONAL PLAN
            personal: {
                name: 'Personal Pro',
                price: 390,               // ~$2.50 USD - affordable for SL market
                duration: 'monthly',
                tagline: 'Everything you need for personal finance',
                features: [
                    'unlimited_transactions',
                    'advanced_tax_calculator',  // Full Sri Lankan tax compliance
                    'investment_tracking',      // Track stocks, fixed deposits, etc.
                    'automated_categorization', // AI-powered expense categorization
                    'custom_reports',          // Unlimited custom reports
                    'data_export',             // CSV, PDF exports
                    'mobile_app_premium',      // Premium mobile features
                    'priority_email_support',  // 24h response time
                    'tax_filing_assistance'    // Help with tax return preparation
                ],
                limits: {
                    transactions: -1,       // Unlimited
                    bankAccounts: 10,       // Multiple bank accounts
                    companies: 0,           // Still no business features
                    employees: 0,
                    storage: 5000,          // 5GB storage
                    reports: -1,            // Unlimited reports
                    taxCalculations: -1     // Unlimited
                },
                color: '#10b981',
                icon: '👤',
                popular: true,
                savings: 'Save 2 hours/week on financial management'
            },

            // BUSINESS STARTER PLAN
            business: {
                name: 'Business Starter',
                price: 1200,              // ~$7.50 USD - competitive for small business
                duration: 'monthly',
                tagline: 'Perfect for small businesses & freelancers',
                features: [
                    'all_personal_features',
                    'business_expense_tracking',
                    'employee_management',      // Up to 5 employees
                    'payroll_basic',           // Basic payroll calculations
                    'vat_management',          // VAT calculations and reporting
                    'invoice_generation',      // Create professional invoices
                    'business_reports',        // P&L, Balance Sheet, Cash Flow
                    'tax_compliance',          // Business tax calculations
                    'phone_support',           // Phone support during business hours
                    'accountant_collaboration' // Share access with accountant
                ],
                limits: {
                    transactions: -1,
                    bankAccounts: -1,
                    companies: 1,           // 1 company
                    employees: 5,           // Up to 5 employees
                    storage: 20000,         // 20GB storage
                    reports: -1,
                    invoices: 100,          // 100 invoices per month
                    vatReturns: 12          // Monthly VAT returns
                },
                color: '#3b82f6',
                icon: '🏢',
                popular: false,
                savings: 'Save 5 hours/week on business admin'
            },

            // PROFESSIONAL/ENTERPRISE PLAN
            professional: {
                name: 'Professional',
                price: 2500,              // ~$15 USD - for established businesses
                duration: 'monthly',
                tagline: 'For growing businesses & professionals',
                features: [
                    'all_business_features',
                    'unlimited_employees',
                    'advanced_payroll',        // Full payroll with EPF/ETF
                    'multi_company_management',
                    'advanced_analytics',      // Business intelligence dashboards
                    'api_access',             // For integrations
                    'custom_integrations',    // Connect to banks, payment gateways
                    'dedicated_support',      // Dedicated account manager
                    'training_sessions',      // Monthly training sessions
                    'tax_expert_consultation', // Monthly consultation calls
                    'white_label_reports'     // Branded reports for clients
                ],
                limits: {
                    transactions: -1,
                    bankAccounts: -1,
                    companies: 10,          // Up to 10 companies
                    employees: -1,          // Unlimited employees
                    storage: -1,            // Unlimited storage
                    reports: -1,
                    invoices: -1,
                    apiCalls: 10000         // 10k API calls per month
                },
                color: '#7c3aed',
                icon: '🚀',
                popular: false,
                savings: 'Save 15 hours/week, increase accuracy by 95%'
            }
        };

        // ADD-ON SERVICES (Additional Revenue Streams)
        this.addOns = {
            tax_filing_service: {
                name: 'Tax Filing Service',
                price: 2500,             // One-time per year
                description: 'Professional tax return preparation and filing',
                icon: '📋'
            },
            accountant_connect: {
                name: 'Accountant Connect',
                price: 500,              // Monthly
                description: 'Connect with verified accountants in Sri Lanka',
                icon: '👨‍💼'
            },
            business_consultation: {
                name: 'Business Consultation',
                price: 1500,             // Per session
                description: '1-hour business financial consultation',
                icon: '💼'
            },
            custom_integration: {
                name: 'Custom Integration',
                price: 15000,            // One-time setup
                description: 'Custom integration with your existing systems',
                icon: '🔗'
            },
            priority_support: {
                name: 'Priority Support',
                price: 300,              // Monthly add-on
                description: '2-hour response time guarantee',
                icon: '⚡'
            }
        };

        // SPECIAL OFFERS
        this.specialOffers = {
            annual_discount: {
                name: 'Annual Billing Discount',
                discount: 20,            // 20% off for annual billing
                description: 'Save 20% when you pay annually'
            },
            student_discount: {
                name: 'Student Discount',
                discount: 50,            // 50% off for verified students
                description: 'Special pricing for university students',
                verification_required: true
            },
            startup_program: {
                name: 'Startup Program',
                discount: 75,            // 75% off for first 6 months
                description: 'Special pricing for new startups',
                duration: 6,             // months
                requirements: 'Company less than 2 years old'
            },
            ngo_discount: {
                name: 'NGO Discount',
                discount: 60,            // 60% off for non-profits
                description: 'Special pricing for registered NGOs'
            }
        };

        // REVENUE OPTIMIZATION STRATEGIES
        this.revenueStrategies = {
            freemium_conversion: {
                strategy: 'Value-First Approach',
                description: 'Provide real value in free tier, then upsell based on usage',
                tactics: [
                    'Limit transactions to create upgrade pressure',
                    'Show advanced features preview',
                    'Send upgrade prompts at limit reached',
                    'Offer free trial of paid features'
                ]
            },
            local_market_focus: {
                strategy: 'Sri Lankan Market Specialization',
                description: 'Focus on local tax laws, banking, and business practices',
                tactics: [
                    'Sri Lankan tax calculator',
                    'Local bank integrations',
                    'Sinhala/Tamil language support',
                    'Local payment methods (PayHere, bank transfers)'
                ]
            },
            service_based_revenue: {
                strategy: 'Professional Services',
                description: 'Offer high-value services alongside software',
                tactics: [
                    'Tax filing services',
                    'Bookkeeping services',
                    'Business consultation',
                    'Training and certification programs'
                ]
            }
        };

        this.init();
    }

    init() {
        console.log('🚀 New Monetization Strategy Initialized');
        this.calculateProjectedRevenue();
    }

    // Calculate projected revenue based on new pricing
    calculateProjectedRevenue() {
        const projectedUsers = {
            starter: 1000,      // Free users
            personal: 200,      // 20% conversion rate
            business: 50,       // 5% of total users
            professional: 10    // 1% of total users
        };

        const monthlyRevenue = 
            (projectedUsers.personal * this.newTiers.personal.price) +
            (projectedUsers.business * this.newTiers.business.price) +
            (projectedUsers.professional * this.newTiers.professional.price);

        const annualRevenue = monthlyRevenue * 12;

        console.log('💰 Projected Revenue Analysis:');
        console.log(`Monthly Revenue: LKR ${monthlyRevenue.toLocaleString()}`);
        console.log(`Annual Revenue: LKR ${annualRevenue.toLocaleString()}`);
        console.log(`USD Annual: $${(annualRevenue / 160).toLocaleString()}`); // Assuming 160 LKR = 1 USD

        return {
            monthly: monthlyRevenue,
            annual: annualRevenue,
            usd_annual: annualRevenue / 160
        };
    }

    // Get pricing for display
    getPricingDisplay() {
        return Object.keys(this.newTiers).map(tierKey => {
            const tier = this.newTiers[tierKey];
            return {
                id: tierKey,
                ...tier,
                priceDisplay: tier.price === 0 ? 'Free' : `LKR ${tier.price}/month`,
                priceUSD: tier.price === 0 ? 'Free' : `$${(tier.price / 160).toFixed(2)}/month`
            };
        });
    }

    // Get recommended tier based on user profile
    getRecommendedTier(userProfile) {
        if (userProfile.type === 'student') {
            return 'personal'; // With student discount
        } else if (userProfile.type === 'business' || userProfile.hasEmployees) {
            return userProfile.employeeCount > 5 ? 'professional' : 'business';
        } else {
            return userProfile.monthlyTransactions > 100 ? 'personal' : 'starter';
        }
    }

    // Apply discounts and special offers
    calculateDiscountedPrice(tierKey, userProfile, billingPeriod = 'monthly') {
        const tier = this.newTiers[tierKey];
        let price = tier.price;

        // Apply annual discount
        if (billingPeriod === 'annual') {
            price = price * 12 * 0.8; // 20% discount
        }

        // Apply user-specific discounts
        if (userProfile.isStudent && this.specialOffers.student_discount) {
            price = price * 0.5; // 50% off for students
        } else if (userProfile.isStartup && this.specialOffers.startup_program) {
            price = price * 0.25; // 75% off for startups
        } else if (userProfile.isNGO && this.specialOffers.ngo_discount) {
            price = price * 0.4; // 60% off for NGOs
        }

        return Math.round(price);
    }

    // Migration strategy from old to new pricing
    getMigrationStrategy() {
        return {
            existing_free_users: {
                action: 'Grandfather for 3 months',
                message: 'Your current features remain free for 3 months',
                upgrade_incentive: '50% off first year if you upgrade now'
            },
            existing_paid_users: {
                action: 'Honor current pricing until renewal',
                message: 'Your current plan continues at the same price',
                upgrade_incentive: 'Get new features at no extra cost'
            },
            communication_plan: [
                'Email announcement of new features and pricing',
                'In-app notification with upgrade benefits',
                'Personal consultation call for business users',
                'Webinar explaining new features and pricing'
            ]
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewMonetizationStrategy;
}

// Initialize for demo
const newMonetization = new NewMonetizationStrategy();

// Make available globally for testing
window.newMonetization = newMonetization;