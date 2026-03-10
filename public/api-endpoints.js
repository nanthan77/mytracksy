// MyTracksy Backend API Endpoints
// Version: 1.0.0
// This file simulates backend API endpoints for development/demo purposes

class APIEndpoints {
    constructor() {
        this.baseURL = '/api/v1';
        this.authToken = null;
        this.init();
    }

    init() {
        // Initialize API endpoints
        this.setupRoutes();
        
        // Check authentication
        this.authToken = localStorage.getItem('mytracksy_auth_token');
    }

    // Authentication endpoints
    async login(email, password) {
        try {
            // Simulate API call
            await this.delay(1000);
            
            // Basic validation (in production, this would be server-side)
            const users = this.getStoredUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                const token = this.generateAuthToken(user);
                localStorage.setItem('mytracksy_auth_token', token);
                localStorage.setItem('mytracksy_current_user', JSON.stringify(user));
                
                return {
                    success: true,
                    data: {
                        user: { ...user, password: undefined },
                        token: token
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async register(userData) {
        try {
            await this.delay(1500);
            
            const users = this.getStoredUsers();
            
            // Check if user already exists
            if (users.find(u => u.email === userData.email)) {
                return {
                    success: false,
                    error: 'User already exists'
                };
            }
            
            // Create new user
            const newUser = {
                id: this.generateId(),
                ...userData,
                createdAt: new Date().toISOString(),
                subscription: {
                    tier: 'free',
                    status: 'active',
                    startDate: new Date().toISOString()
                }
            };
            
            users.push(newUser);
            this.saveUsers(users);
            
            const token = this.generateAuthToken(newUser);
            localStorage.setItem('mytracksy_auth_token', token);
            localStorage.setItem('mytracksy_current_user', JSON.stringify(newUser));
            
            return {
                success: true,
                data: {
                    user: { ...newUser, password: undefined },
                    token: token
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        localStorage.removeItem('mytracksy_auth_token');
        localStorage.removeItem('mytracksy_current_user');
        this.authToken = null;
        
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    // User management endpoints
    async getCurrentUser() {
        try {
            if (!this.authToken) {
                return {
                    success: false,
                    error: 'Not authenticated'
                };
            }
            
            const currentUser = JSON.parse(localStorage.getItem('mytracksy_current_user') || '{}');
            
            return {
                success: true,
                data: { ...currentUser, password: undefined }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateUserProfile(userData) {
        try {
            await this.delay(800);
            
            if (!this.authToken) {
                return {
                    success: false,
                    error: 'Not authenticated'
                };
            }
            
            const currentUser = JSON.parse(localStorage.getItem('mytracksy_current_user') || '{}');
            const updatedUser = { ...currentUser, ...userData, updatedAt: new Date().toISOString() };
            
            // Update in users array
            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = updatedUser;
                this.saveUsers(users);
            }
            
            localStorage.setItem('mytracksy_current_user', JSON.stringify(updatedUser));
            
            return {
                success: true,
                data: { ...updatedUser, password: undefined }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Subscription management endpoints
    async getSubscriptionStatus() {
        try {
            await this.delay(500);
            
            const currentUser = JSON.parse(localStorage.getItem('mytracksy_current_user') || '{}');
            const subscription = currentUser.subscription || { tier: 'free', status: 'active' };
            
            return {
                success: true,
                data: subscription
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async upgradeSubscription(newTier, paymentData) {
        try {
            await this.delay(2000); // Simulate payment processing
            
            const currentUser = JSON.parse(localStorage.getItem('mytracksy_current_user') || '{}');
            
            // Update subscription
            const updatedSubscription = {
                tier: newTier,
                status: 'active',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                paymentMethod: paymentData.method,
                amount: this.getSubscriptionPrice(newTier),
                transactionId: this.generateTransactionId()
            };
            
            currentUser.subscription = updatedSubscription;
            
            // Update stored user data
            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                this.saveUsers(users);
            }
            
            localStorage.setItem('mytracksy_current_user', JSON.stringify(currentUser));
            
            // Reset usage tracking
            localStorage.removeItem('mytracksy_usage');
            
            return {
                success: true,
                data: updatedSubscription
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Usage tracking endpoints
    async getUsageStats() {
        try {
            await this.delay(300);
            
            const usage = JSON.parse(localStorage.getItem('mytracksy_usage') || '{}');
            const defaultUsage = {
                transactions: 0,
                bankAccounts: 0,
                companies: 0,
                employees: 0,
                storage: 0,
                lastReset: new Date().toISOString()
            };
            
            return {
                success: true,
                data: { ...defaultUsage, ...usage }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async trackUsage(type, amount = 1) {
        try {
            const usage = JSON.parse(localStorage.getItem('mytracksy_usage') || '{}');
            usage[type] = (usage[type] || 0) + amount;
            usage.lastActivity = new Date().toISOString();
            
            localStorage.setItem('mytracksy_usage', JSON.stringify(usage));
            
            return {
                success: true,
                data: usage
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Financial data endpoints
    async saveExpense(expenseData) {
        try {
            await this.delay(500);
            
            const expenses = this.getStoredExpenses();
            const newExpense = {
                id: this.generateId(),
                ...expenseData,
                createdAt: new Date().toISOString(),
                userId: this.getCurrentUserId()
            };
            
            expenses.push(newExpense);
            this.saveExpenses(expenses);
            
            // Track usage
            await this.trackUsage('transactions');
            
            return {
                success: true,
                data: newExpense
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getExpenses(filters = {}) {
        try {
            await this.delay(400);
            
            let expenses = this.getStoredExpenses();
            const userId = this.getCurrentUserId();
            
            // Filter by user
            expenses = expenses.filter(expense => expense.userId === userId);
            
            // Apply additional filters
            if (filters.dateFrom) {
                expenses = expenses.filter(expense => 
                    new Date(expense.createdAt) >= new Date(filters.dateFrom)
                );
            }
            
            if (filters.dateTo) {
                expenses = expenses.filter(expense => 
                    new Date(expense.createdAt) <= new Date(filters.dateTo)
                );
            }
            
            if (filters.category) {
                expenses = expenses.filter(expense => 
                    expense.category === filters.category
                );
            }
            
            return {
                success: true,
                data: expenses
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteExpense(expenseId) {
        try {
            await this.delay(300);
            
            let expenses = this.getStoredExpenses();
            const userId = this.getCurrentUserId();
            
            expenses = expenses.filter(expense => 
                !(expense.id === expenseId && expense.userId === userId)
            );
            
            this.saveExpenses(expenses);
            
            return {
                success: true,
                message: 'Expense deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Company management endpoints
    async saveCompany(companyData) {
        try {
            await this.delay(800);
            
            const companies = this.getStoredCompanies();
            const newCompany = {
                id: this.generateId(),
                ...companyData,
                createdAt: new Date().toISOString(),
                userId: this.getCurrentUserId()
            };
            
            companies.push(newCompany);
            this.saveCompanies(companies);
            
            // Track usage
            await this.trackUsage('companies');
            
            return {
                success: true,
                data: newCompany
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCompanies() {
        try {
            await this.delay(400);
            
            let companies = this.getStoredCompanies();
            const userId = this.getCurrentUserId();
            
            companies = companies.filter(company => company.userId === userId);
            
            return {
                success: true,
                data: companies
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Admin endpoints
    async getAllUsers() {
        try {
            await this.delay(600);
            
            if (!this.isAdmin()) {
                return {
                    success: false,
                    error: 'Admin access required'
                };
            }
            
            const users = this.getStoredUsers().map(user => ({
                ...user,
                password: undefined // Never return passwords
            }));
            
            return {
                success: true,
                data: users
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAllSubscriptions() {
        try {
            await this.delay(600);
            
            if (!this.isAdmin()) {
                return {
                    success: false,
                    error: 'Admin access required'
                };
            }
            
            const users = this.getStoredUsers();
            const subscriptions = users.map(user => ({
                userId: user.id,
                userEmail: user.email,
                ...user.subscription
            }));
            
            return {
                success: true,
                data: subscriptions
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSystemStats() {
        try {
            await this.delay(400);
            
            if (!this.isAdmin()) {
                return {
                    success: false,
                    error: 'Admin access required'
                };
            }
            
            const users = this.getStoredUsers();
            const expenses = this.getStoredExpenses();
            const companies = this.getStoredCompanies();
            
            const stats = {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.status !== 'inactive').length,
                totalExpenses: expenses.length,
                totalCompanies: companies.length,
                subscriptionBreakdown: this.getSubscriptionBreakdown(users),
                monthlyRevenue: this.calculateMonthlyRevenue(users)
            };
            
            return {
                success: true,
                data: stats
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    setupRoutes() {
        // This would set up actual API routes in a real backend
        console.log('API Routes initialized');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    generateAuthToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            timestamp: Date.now()
        };
        
        return btoa(JSON.stringify(payload)) + '.' + Math.random().toString(36);
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    }

    getCurrentUserId() {
        const currentUser = JSON.parse(localStorage.getItem('mytracksy_current_user') || '{}');
        return currentUser.id;
    }

    isAdmin() {
        return localStorage.getItem('mytracksy_admin_access') === 'true';
    }

    // Data storage methods (simulating database)
    getStoredUsers() {
        return JSON.parse(localStorage.getItem('mytracksy_all_users') || '[]');
    }

    saveUsers(users) {
        localStorage.setItem('mytracksy_all_users', JSON.stringify(users));
    }

    getStoredExpenses() {
        return JSON.parse(localStorage.getItem('mytracksy_all_expenses') || '[]');
    }

    saveExpenses(expenses) {
        localStorage.setItem('mytracksy_all_expenses', JSON.stringify(expenses));
    }

    getStoredCompanies() {
        return JSON.parse(localStorage.getItem('mytracksy_all_companies') || '[]');
    }

    saveCompanies(companies) {
        localStorage.setItem('mytracksy_all_companies', JSON.stringify(companies));
    }

    getSubscriptionPrice(tier) {
        const prices = {
            free: 0,
            freemium: 499,
            premium: 999,
            business: 2499,
            enterprise: 9999,
            student: 199
        };
        
        return prices[tier] || 0;
    }

    getSubscriptionBreakdown(users) {
        const breakdown = {};
        
        users.forEach(user => {
            const tier = user.subscription?.tier || 'free';
            breakdown[tier] = (breakdown[tier] || 0) + 1;
        });
        
        return breakdown;
    }

    calculateMonthlyRevenue(users) {
        return users
            .filter(user => user.subscription?.status === 'active')
            .reduce((total, user) => {
                const tier = user.subscription?.tier || 'free';
                return total + this.getSubscriptionPrice(tier);
            }, 0);
    }

    // Static factory method
    static createInstance() {
        return new APIEndpoints();
    }
}

// Initialize API endpoints
const apiEndpoints = new APIEndpoints();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIEndpoints;
}

// Global API functions for easy access
window.api = {
    // Authentication
    login: (email, password) => apiEndpoints.login(email, password),
    register: (userData) => apiEndpoints.register(userData),
    logout: () => apiEndpoints.logout(),
    
    // User management
    getCurrentUser: () => apiEndpoints.getCurrentUser(),
    updateUserProfile: (userData) => apiEndpoints.updateUserProfile(userData),
    
    // Subscriptions
    getSubscriptionStatus: () => apiEndpoints.getSubscriptionStatus(),
    upgradeSubscription: (tier, paymentData) => apiEndpoints.upgradeSubscription(tier, paymentData),
    
    // Usage tracking
    getUsageStats: () => apiEndpoints.getUsageStats(),
    trackUsage: (type, amount) => apiEndpoints.trackUsage(type, amount),
    
    // Financial data
    saveExpense: (expenseData) => apiEndpoints.saveExpense(expenseData),
    getExpenses: (filters) => apiEndpoints.getExpenses(filters),
    deleteExpense: (expenseId) => apiEndpoints.deleteExpense(expenseId),
    
    // Company management
    saveCompany: (companyData) => apiEndpoints.saveCompany(companyData),
    getCompanies: () => apiEndpoints.getCompanies(),
    
    // Admin
    getAllUsers: () => apiEndpoints.getAllUsers(),
    getAllSubscriptions: () => apiEndpoints.getAllSubscriptions(),
    getSystemStats: () => apiEndpoints.getSystemStats()
};