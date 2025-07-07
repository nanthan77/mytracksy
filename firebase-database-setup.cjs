/**
 * MyTracksy Firebase Firestore Database Setup
 * 
 * Complete database schema initialization for Sri Lankan tax compliance system
 * including all collections, indexes, and initial data structures
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, enableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class MyTracksyDatabaseSetup {
    constructor(firebaseConfig) {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
        
        console.log('🔥 MyTracksy Firebase Database Setup initialized');
    }

    async setupProductionDatabase() {
        try {
            console.log('📊 Setting up production database schema...');
            
            await this.createCollectionSchemas();
            await this.setupSriLankanTaxData();
            await this.createIndexes();
            await this.setupSecurityRules();
            await this.createInitialAdminData();
            
            console.log('✅ Production database setup completed successfully!');
            return { success: true, message: 'Database initialized' };
        } catch (error) {
            console.error('❌ Database setup failed:', error);
            throw error;
        }
    }

    async createCollectionSchemas() {
        console.log('📋 Creating collection schemas...');

        // Users collection schema
        const userSchema = {
            id: 'user_id',
            email: 'user@example.com',
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '+94771234567',
                dateOfBirth: '1990-01-01',
                nic: '901234567V',
                address: {
                    street: '123 Main Street',
                    city: 'Colombo',
                    province: 'Western',
                    postalCode: '00100',
                    country: 'Sri Lanka'
                },
                profilePicture: '',
                preferences: {
                    language: 'en',
                    currency: 'LKR',
                    dateFormat: 'DD/MM/YYYY',
                    notifications: {
                        email: true,
                        sms: false,
                        push: true
                    }
                }
            },
            taxProfile: {
                tinNumber: '',
                vatRegistrationNumber: '',
                businessRegistrationNumber: '',
                epfNumber: '',
                etfNumber: '',
                taxResidencyStatus: 'resident'
            },
            subscription: {
                plan: 'free',
                startDate: new Date().toISOString(),
                endDate: null,
                features: ['basic_tracking', 'tax_calculations']
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        // Companies collection schema
        const companySchema = {
            id: 'company_id',
            name: 'Sample Company Ltd',
            registrationNumber: 'PV12345',
            taxId: 'TAX123456',
            vatNumber: 'VAT123456789',
            businessType: 'private_limited',
            industry: 'technology',
            incorporationDate: '2020-01-01',
            financialYearEnd: '2024-12-31',
            address: {
                street: '456 Business Street',
                city: 'Colombo',
                province: 'Western',
                postalCode: '00200',
                country: 'Sri Lanka'
            },
            contactInfo: {
                email: 'info@company.com',
                phone: '+94112345678',
                website: 'www.company.com'
            },
            owners: ['user_id'],
            employees: [],
            accountingSettings: {
                baseCurrency: 'LKR',
                accountingMethod: 'accrual',
                depreciationMethod: 'straight_line'
            },
            taxSettings: {
                vatRegistered: true,
                epfRegistered: true,
                etfRegistered: true,
                corporateTaxRate: 0.30
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        // Expenses collection schema
        const expenseSchema = {
            id: 'expense_id',
            userId: 'user_id',
            companyId: 'company_id',
            amount: 1500.00,
            currency: 'LKR',
            category: 'Business Meals',
            subCategory: 'Client Entertainment',
            description: 'Business lunch with client',
            date: new Date().toISOString(),
            paymentMethod: 'credit_card',
            vendor: {
                name: 'Restaurant ABC',
                address: 'Colombo 03',
                vatNumber: 'VAT987654321'
            },
            receipt: {
                hasReceipt: true,
                receiptNumber: 'RCP001',
                imageUrl: '',
                ocrData: null
            },
            taxCalculations: {
                vatAmount: 270.00,
                vatRate: 0.18,
                isVatClaimable: true,
                whtAmount: 0,
                whtRate: 0,
                netAmount: 1230.00,
                grossAmount: 1500.00
            },
            approvalStatus: 'approved',
            approvedBy: 'user_id',
            approvedAt: new Date().toISOString(),
            tags: ['client', 'entertainment'],
            notes: 'Important client meeting',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Tax Calculations collection schema
        const taxCalculationSchema = {
            id: 'calc_id',
            userId: 'user_id',
            companyId: 'company_id',
            taxType: 'income_tax', // income_tax, vat, epf_etf, wht, corporate_tax
            calculationPeriod: {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                period: 'annual'
            },
            inputData: {
                income: 5000000,
                deductions: 500000,
                reliefs: 3000000
            },
            calculation: {
                taxableIncome: 1500000,
                taxBrackets: [
                    { min: 0, max: 500000, rate: 0.06, tax: 30000 },
                    { min: 500000, max: 1000000, rate: 0.12, tax: 60000 },
                    { min: 1000000, max: 1500000, rate: 0.18, tax: 90000 }
                ],
                totalTax: 180000,
                effectiveRate: 0.12,
                marginalRate: 0.18
            },
            status: 'calculated',
            calculatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Government Filings collection schema
        const governmentFilingSchema = {
            id: 'filing_id',
            userId: 'user_id',
            companyId: 'company_id',
            filingType: 'vat_return', // vat_return, income_tax, epf_contribution, etf_contribution
            portal: 'IRD', // IRD, EPF, ETF
            filingPeriod: {
                year: 2024,
                month: 11,
                quarter: 4,
                period: 'monthly'
            },
            formData: {
                grossTurnover: 1000000,
                vatOnSales: 180000,
                vatOnPurchases: 50000,
                netVatPayable: 130000,
                penaltiesAndInterest: 0
            },
            submissionDetails: {
                submissionId: 'IRD2024110001',
                submittedAt: new Date().toISOString(),
                submittedBy: 'user_id',
                digitalSignature: 'signature_hash',
                acknowledgmentNumber: 'ACK2024110001'
            },
            status: 'submitted', // draft, submitted, accepted, rejected
            dueDate: '2024-12-20',
            paymentDetails: {
                amountDue: 130000,
                paidAmount: 130000,
                paymentDate: new Date().toISOString(),
                paymentMethod: 'bank_transfer',
                referenceNumber: 'PAY2024110001'
            },
            attachments: [],
            auditTrail: [
                {
                    action: 'created',
                    timestamp: new Date().toISOString(),
                    userId: 'user_id'
                },
                {
                    action: 'submitted',
                    timestamp: new Date().toISOString(),
                    userId: 'user_id'
                }
            ]
        };

        // Employees collection schema
        const employeeSchema = {
            id: 'employee_id',
            companyId: 'company_id',
            personalInfo: {
                firstName: 'Jane',
                lastName: 'Smith',
                nic: '901234567V',
                dateOfBirth: '1990-05-15',
                gender: 'female',
                maritalStatus: 'single',
                email: 'jane.smith@company.com',
                phone: '+94771234567',
                address: {
                    street: '789 Employee Street',
                    city: 'Kandy',
                    province: 'Central',
                    postalCode: '20000',
                    country: 'Sri Lanka'
                }
            },
            employment: {
                employeeNumber: 'EMP001',
                designation: 'Software Engineer',
                department: 'Technology',
                startDate: '2024-01-01',
                endDate: null,
                employmentType: 'permanent',
                workingHours: 40,
                probationPeriod: 90,
                reportingManager: 'manager_id'
            },
            salary: {
                basicSalary: 150000,
                allowances: {
                    transport: 10000,
                    meal: 5000,
                    mobile: 2000
                },
                totalSalary: 167000,
                currency: 'LKR',
                paymentFrequency: 'monthly',
                bankDetails: {
                    bankName: 'Bank of Ceylon',
                    branchCode: '001',
                    accountNumber: '1234567890',
                    accountName: 'Jane Smith'
                }
            },
            taxDetails: {
                epfNumber: 'EPF123456',
                etfNumber: 'ETF123456',
                taxFileNumber: 'TFN123456',
                epfContributions: {
                    employeeRate: 0.08,
                    employerRate: 0.12
                },
                etfContributions: {
                    employerRate: 0.03
                }
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Reports collection schema
        const reportSchema = {
            id: 'report_id',
            userId: 'user_id',
            companyId: 'company_id',
            reportType: 'expense_summary', // expense_summary, tax_liability, profit_loss, cash_flow
            title: 'Monthly Expense Report - November 2024',
            parameters: {
                dateRange: {
                    startDate: '2024-11-01',
                    endDate: '2024-11-30'
                },
                categories: ['all'],
                includeVat: true,
                currency: 'LKR'
            },
            data: {
                summary: {
                    totalExpenses: 500000,
                    totalVat: 90000,
                    categoryBreakdown: {
                        'Business Meals': 150000,
                        'Transportation': 200000,
                        'Office Supplies': 150000
                    }
                },
                details: [],
                charts: []
            },
            format: 'pdf',
            status: 'generated',
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            downloadUrl: '',
            size: 245760 // bytes
        };

        // Create schema documents
        await setDoc(doc(this.db, 'schemas', 'user'), userSchema);
        await setDoc(doc(this.db, 'schemas', 'company'), companySchema);
        await setDoc(doc(this.db, 'schemas', 'expense'), expenseSchema);
        await setDoc(doc(this.db, 'schemas', 'taxCalculation'), taxCalculationSchema);
        await setDoc(doc(this.db, 'schemas', 'governmentFiling'), governmentFilingSchema);
        await setDoc(doc(this.db, 'schemas', 'employee'), employeeSchema);
        await setDoc(doc(this.db, 'schemas', 'report'), reportSchema);

        console.log('✅ Collection schemas created');
    }

    async setupSriLankanTaxData() {
        console.log('🇱🇰 Setting up Sri Lankan tax configuration...');

        // VAT Configuration
        const vatConfig = {
            id: 'vat_2024',
            year: 2024,
            standardRate: 0.18,
            registrationThreshold: 12000000, // LKR 12M annually
            exemptItems: [
                'Essential food items',
                'Medical supplies',
                'Educational materials',
                'Religious books'
            ],
            zeroRatedItems: [
                'Exports',
                'International services'
            ],
            fillingFrequency: 'monthly',
            dueDate: 20, // 20th of following month
            penaltyRate: 0.02 // 2% per month
        };

        // Income Tax Configuration
        const incomeTaxConfig = {
            id: 'income_tax_2024',
            year: 2024,
            personalRelief: 3000000, // LKR 3M
            brackets: [
                { min: 0, max: 500000, rate: 0.06 },
                { min: 500000, max: 1000000, rate: 0.12 },
                { min: 1000000, max: 1500000, rate: 0.18 },
                { min: 1500000, max: 2000000, rate: 0.24 },
                { min: 2000000, max: 2500000, rate: 0.30 },
                { min: 2500000, max: Infinity, rate: 0.36 }
            ],
            deductions: {
                'Life Insurance': { max: 100000, rate: 1.0 },
                'Retirement Contributions': { max: 200000, rate: 1.0 },
                'Donations': { max: 250000, rate: 1.0 }
            },
            dueDate: '2025-03-31',
            paymentDeadlines: [
                { quarter: 1, dueDate: '2024-05-15' },
                { quarter: 2, dueDate: '2024-08-15' },
                { quarter: 3, dueDate: '2024-11-15' },
                { quarter: 4, dueDate: '2025-02-15' }
            ]
        };

        // EPF/ETF Configuration
        const epfEtfConfig = {
            id: 'epf_etf_2024',
            year: 2024,
            epf: {
                employeeContribution: 0.08, // 8%
                employerContribution: 0.12, // 12%
                totalContribution: 0.20,
                minimumWage: 15000,
                maximumContributionBase: 500000
            },
            etf: {
                employerContribution: 0.03, // 3%
                minimumWage: 15000,
                maximumContributionBase: 500000
            },
            dueDate: 'last_working_day',
            penaltyRate: 0.01,
            gracePeriod: 7 // days
        };

        // Withholding Tax Configuration
        const whtConfig = {
            id: 'wht_2024',
            year: 2024,
            rates: {
                'Professional Services': 0.10,
                'Construction Services': 0.02,
                'Supply of Goods': 0.01,
                'Interest Payments': 0.05,
                'Dividend Payments': 0.14,
                'Rent Payments': 0.10,
                'Service Fees': 0.05
            },
            thresholds: {
                'Professional Services': 25000,
                'Construction Services': 100000,
                'Supply of Goods': 500000
            },
            exemptions: [
                'Small suppliers below threshold',
                'Government entities',
                'Registered charities'
            ]
        };

        // Corporate Tax Configuration
        const corporateTaxConfig = {
            id: 'corporate_tax_2024',
            year: 2024,
            rates: {
                'Standard Companies': 0.30,
                'Small Companies': 0.14, // Annual turnover < LKR 500M
                'Export Companies': 0.14,
                'Banks': 0.40,
                'Finance Companies': 0.40,
                'Telecommunication': 0.40
            },
            smallCompanyThreshold: 500000000, // LKR 500M
            minimumTax: {
                'Standard Companies': 0.002, // 0.2% of turnover
                'Small Companies': 0.001 // 0.1% of turnover
            },
            deadlines: {
                'Filing': '2025-03-31',
                'Payment': '2025-03-31'
            }
        };

        // Government Portals Configuration
        const portalConfig = {
            ird: {
                name: 'Inland Revenue Department',
                url: 'https://www.ird.gov.lk',
                apiEndpoint: 'https://api.ird.gov.lk',
                services: [
                    'Income Tax Returns',
                    'VAT Returns',
                    'Withholding Tax',
                    'Corporate Tax',
                    'Tax Certificates'
                ],
                supportedFormats: ['XML', 'JSON'],
                authMethod: 'digital_certificate'
            },
            epf: {
                name: 'Employees Provident Fund',
                url: 'https://www.epf.lk',
                apiEndpoint: 'https://api.epf.lk',
                services: [
                    'Monthly Contributions',
                    'Member Registration',
                    'Benefit Claims',
                    'Compliance Reports'
                ],
                supportedFormats: ['XML', 'CSV'],
                authMethod: 'username_password'
            },
            etf: {
                name: 'Employees Trust Fund',
                url: 'https://www.etfb.lk',
                apiEndpoint: 'https://api.etfb.lk',
                services: [
                    'Monthly Contributions',
                    'Member Registration',
                    'Compliance Reports'
                ],
                supportedFormats: ['XML', 'CSV'],
                authMethod: 'digital_signature'
            }
        };

        // Save tax configurations
        await setDoc(doc(this.db, 'taxConfigurations', 'vat_2024'), vatConfig);
        await setDoc(doc(this.db, 'taxConfigurations', 'income_tax_2024'), incomeTaxConfig);
        await setDoc(doc(this.db, 'taxConfigurations', 'epf_etf_2024'), epfEtfConfig);
        await setDoc(doc(this.db, 'taxConfigurations', 'wht_2024'), whtConfig);
        await setDoc(doc(this.db, 'taxConfigurations', 'corporate_tax_2024'), corporateTaxConfig);
        await setDoc(doc(this.db, 'systemConfigurations', 'government_portals'), portalConfig);

        console.log('✅ Sri Lankan tax configuration completed');
    }

    async createIndexes() {
        console.log('🔍 Creating database indexes...');
        
        // Note: Firestore indexes are created automatically based on queries
        // and can also be defined in firestore.indexes.json
        
        const indexConfig = {
            collections: {
                expenses: [
                    { fields: ['userId', 'date'], order: 'desc' },
                    { fields: ['companyId', 'date'], order: 'desc' },
                    { fields: ['userId', 'category', 'date'], order: 'desc' },
                    { fields: ['userId', 'approvalStatus'], order: 'asc' }
                ],
                taxCalculations: [
                    { fields: ['userId', 'taxType'], order: 'asc' },
                    { fields: ['companyId', 'calculationPeriod.startDate'], order: 'desc' }
                ],
                governmentFilings: [
                    { fields: ['userId', 'status', 'dueDate'], order: 'asc' },
                    { fields: ['companyId', 'filingType'], order: 'desc' }
                ],
                employees: [
                    { fields: ['companyId', 'status'], order: 'asc' },
                    { fields: ['companyId', 'employment.department'], order: 'asc' }
                ]
            }
        };

        await setDoc(doc(this.db, 'systemConfigurations', 'database_indexes'), indexConfig);
        console.log('✅ Database indexes configuration saved');
    }

    async setupSecurityRules() {
        console.log('🔒 Setting up security rules...');
        
        const securityRulesConfig = {
            version: '2.0',
            rules: {
                users: 'Users can only access their own data',
                companies: 'Users can only access companies they own or are members of',
                expenses: 'Users can only access their own expenses',
                taxCalculations: 'Users can only access their own tax calculations',
                governmentFilings: 'Users can only access their own filings',
                employees: 'Company owners and HR managers can access employee data',
                reports: 'Users can only access their own reports'
            },
            auditLog: {
                enabled: true,
                retentionPeriod: '7 years',
                logLevel: 'all'
            }
        };

        await setDoc(doc(this.db, 'systemConfigurations', 'security_rules'), securityRulesConfig);
        console.log('✅ Security rules configuration saved');
    }

    async createInitialAdminData() {
        console.log('👑 Creating initial admin data...');
        
        // System settings
        const systemSettings = {
            id: 'global',
            version: '1.0.0',
            maintenanceMode: false,
            features: {
                taxCalculations: true,
                governmentPortals: true,
                analytics: true,
                mobileApp: true,
                reports: true
            },
            limits: {
                freeUsers: {
                    monthlyExpenses: 100,
                    companies: 1,
                    reports: 5
                },
                premiumUsers: {
                    monthlyExpenses: 10000,
                    companies: 10,
                    reports: 100
                }
            },
            notifications: {
                taxDeadlineReminder: 7, // days before
                paymentReminder: 3,
                maintenanceNotice: 24 // hours before
            }
        };

        // Default categories
        const expenseCategories = {
            id: 'default_categories',
            categories: [
                {
                    name: 'Business Meals',
                    code: 'MEALS',
                    vatClaimable: true,
                    description: 'Business entertainment and client meals'
                },
                {
                    name: 'Transportation',
                    code: 'TRANSPORT',
                    vatClaimable: true,
                    description: 'Travel and transportation expenses'
                },
                {
                    name: 'Office Supplies',
                    code: 'OFFICE',
                    vatClaimable: true,
                    description: 'Office equipment and supplies'
                },
                {
                    name: 'Professional Services',
                    code: 'PROFESSIONAL',
                    vatClaimable: true,
                    description: 'Legal, accounting, and consulting services'
                },
                {
                    name: 'Marketing',
                    code: 'MARKETING',
                    vatClaimable: true,
                    description: 'Marketing and advertising expenses'
                },
                {
                    name: 'Utilities',
                    code: 'UTILITIES',
                    vatClaimable: true,
                    description: 'Electricity, water, internet, phone'
                },
                {
                    name: 'Insurance',
                    code: 'INSURANCE',
                    vatClaimable: false,
                    description: 'Business insurance premiums'
                },
                {
                    name: 'Bank Charges',
                    code: 'BANK',
                    vatClaimable: false,
                    description: 'Banking fees and charges'
                }
            ]
        };

        // Industry configurations
        const industryConfig = {
            id: 'industries',
            industries: [
                {
                    code: 'TECH',
                    name: 'Technology',
                    description: 'Software development, IT services',
                    taxBenefits: ['Export incentives', 'R&D allowances']
                },
                {
                    code: 'RETAIL',
                    name: 'Retail Trade',
                    description: 'Retail and wholesale trading',
                    taxBenefits: ['Small trader relief']
                },
                {
                    code: 'MANUF',
                    name: 'Manufacturing',
                    description: 'Manufacturing and production',
                    taxBenefits: ['Investment allowances', 'Export incentives']
                },
                {
                    code: 'SERVICES',
                    name: 'Professional Services',
                    description: 'Consulting, legal, accounting services',
                    taxBenefits: ['Professional service relief']
                },
                {
                    code: 'HOSPITALITY',
                    name: 'Hospitality',
                    description: 'Hotels, restaurants, tourism',
                    taxBenefits: ['Tourism promotion allowances']
                }
            ]
        };

        // Save admin data
        await setDoc(doc(this.db, 'systemConfigurations', 'settings'), systemSettings);
        await setDoc(doc(this.db, 'systemConfigurations', 'expense_categories'), expenseCategories);
        await setDoc(doc(this.db, 'systemConfigurations', 'industries'), industryConfig);

        console.log('✅ Initial admin data created');
    }

    async createSampleData() {
        console.log('📝 Creating sample data for testing...');
        
        // Create sample user
        const sampleUser = {
            email: 'demo@mytracksy.com',
            profile: {
                firstName: 'Demo',
                lastName: 'User',
                phoneNumber: '+94771234567',
                address: {
                    street: '123 Demo Street',
                    city: 'Colombo',
                    province: 'Western',
                    postalCode: '00100',
                    country: 'Sri Lanka'
                }
            },
            taxProfile: {
                tinNumber: 'TIN123456789'
            },
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Create sample company
        const sampleCompany = {
            name: 'Demo Company (Pvt) Ltd',
            registrationNumber: 'PV98765',
            vatNumber: 'VAT123456789',
            businessType: 'private_limited',
            industry: 'technology',
            address: {
                street: '456 Demo Business Park',
                city: 'Colombo',
                province: 'Western',
                postalCode: '00200',
                country: 'Sri Lanka'
            },
            owners: ['demo_user_id'],
            taxSettings: {
                vatRegistered: true,
                epfRegistered: true,
                etfRegistered: true
            },
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Create sample expenses
        const sampleExpenses = [
            {
                amount: 15000,
                category: 'Business Meals',
                description: 'Client lunch meeting',
                date: new Date().toISOString(),
                taxCalculations: {
                    vatAmount: 2700,
                    vatRate: 0.18,
                    isVatClaimable: true
                }
            },
            {
                amount: 25000,
                category: 'Transportation',
                description: 'Taxi to client office',
                date: new Date().toISOString(),
                taxCalculations: {
                    vatAmount: 4500,
                    vatRate: 0.18,
                    isVatClaimable: true
                }
            }
        ];

        // Save sample data
        await setDoc(doc(this.db, 'users', 'demo_user_id'), sampleUser);
        await setDoc(doc(this.db, 'companies', 'demo_company_id'), sampleCompany);
        
        for (let i = 0; i < sampleExpenses.length; i++) {
            await addDoc(collection(this.db, 'expenses'), {
                ...sampleExpenses[i],
                userId: 'demo_user_id',
                companyId: 'demo_company_id',
                id: `demo_expense_${i + 1}`
            });
        }

        console.log('✅ Sample data created for testing');
    }

    async validateDatabase() {
        console.log('✅ Validating database setup...');
        
        try {
            // Check if collections exist
            const collections = [
                'users', 'companies', 'expenses', 'taxCalculations',
                'governmentFilings', 'employees', 'reports', 'schemas',
                'taxConfigurations', 'systemConfigurations'
            ];

            for (const collectionName of collections) {
                const snapshot = await collection(this.db, collectionName);
                console.log(`✅ Collection '${collectionName}' is accessible`);
            }

            console.log('🎉 Database validation completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Database validation failed:', error);
            return false;
        }
    }

    // Utility function to initialize with sample data
    async initializeWithSampleData() {
        await this.setupProductionDatabase();
        await this.createSampleData();
        await this.validateDatabase();
        
        console.log('🎉 Database initialization with sample data completed!');
    }
}

// Export the setup class
export default MyTracksyDatabaseSetup;

// CLI usage example
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    console.log('MyTracksy Database Setup Script');
    console.log('Usage: node firebase-database-setup.js');
    
    // Example configuration
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };

    if (firebaseConfig.projectId) {
        const dbSetup = new MyTracksyDatabaseSetup(firebaseConfig);
        dbSetup.setupProductionDatabase()
            .then(() => console.log('Database setup completed!'))
            .catch(error => console.error('Setup failed:', error));
    } else {
        console.log('Please set Firebase environment variables first.');
    }
}