// MyTracksy Admin Management System
// Version: 1.0.0

class AdminManager {
    constructor() {
        this.apiEndpoint = '/api/admin';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuthentication();
        
        // Initialize Firebase if not already done
        this.initializeFirebase();
        
        // Load initial data
        await this.loadSystemData();
        
        // Set up real-time listeners
        this.setupRealtimeListeners();
    }

    // Authentication Methods
    async checkAuthentication() {
        const adminAccess = localStorage.getItem('mytracksy_admin_access');
        const adminToken = localStorage.getItem('mytracksy_admin_token');
        
        if (!adminAccess || !adminToken) {
            this.redirectToLogin();
            return;
        }
        
        // Verify token validity (in production, verify with server)
        try {
            const isValid = await this.verifyAdminToken(adminToken);
            if (!isValid) {
                this.redirectToLogin();
                return;
            }
            
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(localStorage.getItem('mytracksy_admin_user') || '{}');
        } catch (error) {
            console.error('Authentication error:', error);
            this.redirectToLogin();
        }
    }

    async verifyAdminToken(token) {
        // In production, this would verify with server
        // For demo, we'll do basic validation
        return token && token.startsWith('admin_') && token.length > 20;
    }

    redirectToLogin() {
        if (window.location.pathname !== '/admin-login.html') {
            window.location.href = 'admin-login.html';
        }
    }

    // Firebase Integration
    initializeFirebase() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase not loaded');
            return;
        }

        // Firebase config (should be in environment variables)
        const firebaseConfig = {
            apiKey: "AIzaSyBqZKm4Vp8kDy8t2yRaAGt5hPlJ_wX3QJ8",
            authDomain: "tracksy-8e30c.firebaseapp.com",
            projectId: "tracksy-8e30c",
            storageBucket: "tracksy-8e30c.appspot.com",
            messagingSenderId: "923456789012",
            appId: "1:923456789012:web:abcdef1234567890"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // Data Loading Methods
    async loadSystemData() {
        try {
            await Promise.all([
                this.loadUserStats(),
                this.loadSubscriptionStats(),
                this.loadRevenueStats(),
                this.loadSystemHealth()
            ]);
        } catch (error) {
            console.error('Error loading system data:', error);
            this.showError('Failed to load system data');
        }
    }

    async loadUserStats() {
        try {
            // In production, this would be an API call
            const users = await this.getAllUsers();
            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.status === 'active').length;
            const newUsersThisMonth = users.filter(u => {
                const joinDate = new Date(u.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length;

            this.updateDashboardStat('totalUsers', totalUsers.toLocaleString());
            this.updateDashboardStat('activeUsers', activeUsers.toLocaleString());
            this.updateDashboardStat('newUsersThisMonth', newUsersThisMonth.toLocaleString());
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadSubscriptionStats() {
        try {
            const subscriptions = await this.getAllSubscriptions();
            const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
            const cancelledThisMonth = subscriptions.filter(s => {
                const cancelDate = new Date(s.cancelDate);
                const now = new Date();
                return s.status === 'cancelled' && 
                       cancelDate.getMonth() === now.getMonth() && 
                       cancelDate.getFullYear() === now.getFullYear();
            }).length;

            this.updateDashboardStat('activeSubscriptions', activeSubscriptions.toLocaleString());
            this.updateDashboardStat('cancelledThisMonth', cancelledThisMonth.toLocaleString());
        } catch (error) {
            console.error('Error loading subscription stats:', error);
        }
    }

    async loadRevenueStats() {
        try {
            const subscriptions = await this.getAllSubscriptions();
            const monthlyRevenue = subscriptions
                .filter(s => s.status === 'active')
                .reduce((total, sub) => total + (sub.amount || 0), 0);
            
            const yearlyRevenue = monthlyRevenue * 12;
            
            this.updateDashboardStat('monthlyRevenue', `LKR ${monthlyRevenue.toLocaleString()}`);
            this.updateDashboardStat('yearlyRevenue', `LKR ${yearlyRevenue.toLocaleString()}`);
        } catch (error) {
            console.error('Error loading revenue stats:', error);
        }
    }

    async loadSystemHealth() {
        try {
            // Check various system components
            const health = {
                database: await this.checkDatabaseHealth(),
                firebase: await this.checkFirebaseHealth(),
                storage: await this.checkStorageHealth()
            };

            const overallStatus = Object.values(health).every(status => status) ? 'Online' : 'Issues Detected';
            this.updateDashboardStat('systemStatus', overallStatus);
            
            // Update system alerts
            this.updateSystemAlerts(health);
        } catch (error) {
            console.error('Error checking system health:', error);
            this.updateDashboardStat('systemStatus', 'Error');
        }
    }

    // User Management Methods
    async getAllUsers() {
        try {
            // In production, this would be a server API call
            // For demo, we'll simulate with localStorage and some dummy data
            const users = JSON.parse(localStorage.getItem('mytracksy_all_users') || '[]');
            
            // Add some demo users if none exist
            if (users.length === 0) {
                const demoUsers = [
                    {
                        id: 'user1',
                        email: 'john.doe@email.com',
                        name: 'John Doe',
                        subscription: 'premium',
                        status: 'active',
                        joinDate: '2024-06-15T10:30:00Z',
                        lastLogin: '2024-07-09T09:15:00Z'
                    },
                    {
                        id: 'user2',
                        email: 'business@company.lk',
                        name: 'ABC Company',
                        subscription: 'business',
                        status: 'active',
                        joinDate: '2024-05-20T14:22:00Z',
                        lastLogin: '2024-07-08T16:45:00Z'
                    },
                    {
                        id: 'user3',
                        email: 'student@uni.ac.lk',
                        name: 'Jane Student',
                        subscription: 'student',
                        status: 'active',
                        joinDate: '2024-07-01T08:00:00Z',
                        lastLogin: '2024-07-09T07:30:00Z'
                    }
                ];
                
                localStorage.setItem('mytracksy_all_users', JSON.stringify(demoUsers));
                return demoUsers;
            }
            
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async getAllSubscriptions() {
        try {
            // Simulate subscription data
            const subscriptions = JSON.parse(localStorage.getItem('mytracksy_all_subscriptions') || '[]');
            
            if (subscriptions.length === 0) {
                const demoSubscriptions = [
                    {
                        id: 'sub1',
                        userId: 'user1',
                        plan: 'premium',
                        status: 'active',
                        amount: 999,
                        currency: 'LKR',
                        startDate: '2024-06-15T10:30:00Z',
                        nextBilling: '2024-08-15T10:30:00Z'
                    },
                    {
                        id: 'sub2',
                        userId: 'user2',
                        plan: 'business',
                        status: 'active',
                        amount: 2499,
                        currency: 'LKR',
                        startDate: '2024-05-20T14:22:00Z',
                        nextBilling: '2024-08-20T14:22:00Z'
                    },
                    {
                        id: 'sub3',
                        userId: 'user3',
                        plan: 'student',
                        status: 'active',
                        amount: 199,
                        currency: 'LKR',
                        startDate: '2024-07-01T08:00:00Z',
                        nextBilling: '2024-08-01T08:00:00Z'
                    }
                ];
                
                localStorage.setItem('mytracksy_all_subscriptions', JSON.stringify(demoSubscriptions));
                return demoSubscriptions;
            }
            
            return subscriptions;
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            return [];
        }
    }

    // Health Check Methods
    async checkDatabaseHealth() {
        try {
            // Simulate database health check
            const testData = { timestamp: Date.now() };
            localStorage.setItem('mytracksy_health_check', JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem('mytracksy_health_check'));
            return retrieved.timestamp === testData.timestamp;
        } catch (error) {
            return false;
        }
    }

    async checkFirebaseHealth() {
        try {
            if (!this.db) return false;
            
            // Try to read from Firestore
            const testDoc = await this.db.collection('health').doc('test').get();
            return true; // If no error, Firebase is working
        } catch (error) {
            return false;
        }
    }

    async checkStorageHealth() {
        try {
            // Check localStorage availability and space
            const testKey = 'mytracksy_storage_test';
            const testData = 'x'.repeat(1024); // 1KB test
            localStorage.setItem(testKey, testData);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            return retrieved === testData;
        } catch (error) {
            return false;
        }
    }

    // Real-time Updates
    setupRealtimeListeners() {
        // Set up real-time listeners for data changes
        if (this.db) {
            // Listen for user changes
            this.db.collection('users').onSnapshot((snapshot) => {
                this.handleUserUpdates(snapshot);
            });
            
            // Listen for subscription changes
            this.db.collection('subscriptions').onSnapshot((snapshot) => {
                this.handleSubscriptionUpdates(snapshot);
            });
        }
        
        // Set up periodic health checks
        setInterval(() => {
            this.loadSystemHealth();
        }, 30000); // Every 30 seconds
    }

    handleUserUpdates(snapshot) {
        // Handle real-time user updates
        this.loadUserStats();
        this.addLogEntry('INFO: User data updated in real-time');
    }

    handleSubscriptionUpdates(snapshot) {
        // Handle real-time subscription updates
        this.loadSubscriptionStats();
        this.loadRevenueStats();
        this.addLogEntry('INFO: Subscription data updated in real-time');
    }

    // Utility Methods
    updateDashboardStat(statId, value) {
        const element = document.getElementById(statId);
        if (element) {
            element.textContent = value;
        }
    }

    updateSystemAlerts(health) {
        const alertsContainer = document.getElementById('systemAlerts');
        if (!alertsContainer) return;

        let alertsHtml = '';
        
        if (health.database && health.firebase && health.storage) {
            alertsHtml = `
                <div class="alert alert-info">
                    <strong>System Status:</strong> All services are running normally.
                </div>
            `;
        } else {
            alertsHtml = `
                <div class="alert alert-warning">
                    <strong>System Issues Detected:</strong>
                    ${!health.database ? 'Database connection issues. ' : ''}
                    ${!health.firebase ? 'Firebase connection issues. ' : ''}
                    ${!health.storage ? 'Storage issues detected. ' : ''}
                </div>
            `;
        }
        
        alertsContainer.innerHTML = alertsHtml;
    }

    addLogEntry(message) {
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        const logsContainer = document.getElementById('logsContainer');
        if (logsContainer) {
            logsContainer.insertBefore(logEntry, logsContainer.firstChild);
            
            // Keep only last 100 log entries
            const entries = logsContainer.querySelectorAll('.log-entry');
            if (entries.length > 100) {
                entries[entries.length - 1].remove();
            }
        }
        
        // Also store in localStorage for persistence
        this.persistLogEntry(message);
    }

    persistLogEntry(message) {
        const logs = JSON.parse(localStorage.getItem('mytracksy_admin_logs') || '[]');
        const timestamp = new Date().toISOString();
        
        logs.unshift({ timestamp, message });
        
        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs.splice(1000);
        }
        
        localStorage.setItem('mytracksy_admin_logs', JSON.stringify(logs));
    }

    showError(message) {
        console.error('Admin Error:', message);
        // You could show a toast notification here
        this.addLogEntry(`ERROR: ${message}`);
    }

    showSuccess(message) {
        console.log('Admin Success:', message);
        this.addLogEntry(`SUCCESS: ${message}`);
    }

    // Export Methods
    async exportUserData() {
        try {
            const users = await this.getAllUsers();
            const csvData = this.convertToCSV(users);
            this.downloadCSV(csvData, 'mytracksy-users.csv');
            this.addLogEntry('INFO: User data exported successfully');
        } catch (error) {
            this.showError('Failed to export user data');
        }
    }

    async exportSubscriptionData() {
        try {
            const subscriptions = await this.getAllSubscriptions();
            const csvData = this.convertToCSV(subscriptions);
            this.downloadCSV(csvData, 'mytracksy-subscriptions.csv');
            this.addLogEntry('INFO: Subscription data exported successfully');
        } catch (error) {
            this.showError('Failed to export subscription data');
        }
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // System Management Methods
    async updateSystemSettings(settings) {
        try {
            // In production, this would be an API call
            localStorage.setItem('mytracksy_system_settings', JSON.stringify(settings));
            this.addLogEntry('INFO: System settings updated');
            return true;
        } catch (error) {
            this.showError('Failed to update system settings');
            return false;
        }
    }

    async getSystemSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('mytracksy_system_settings') || '{}');
            return {
                maintenanceMode: false,
                maxUsersPerPlan: 1000,
                paymentGateway: 'both',
                ...settings
            };
        } catch (error) {
            this.showError('Failed to load system settings');
            return {};
        }
    }

    // Static factory method
    static createInstance() {
        return new AdminManager();
    }
}

// Initialize admin manager when script loads
let adminManager = null;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adminManager = new AdminManager();
    });
} else {
    adminManager = new AdminManager();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}