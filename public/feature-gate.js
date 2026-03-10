// Feature Gating Integration for MyTracksy
// This file integrates with existing pages to control feature access

// Initialize feature gates when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFeatureGates();
});

function initializeFeatureGates() {
    // Add subscription manager script if not already loaded
    if (typeof subscriptionManager === 'undefined') {
        const script = document.createElement('script');
        script.src = 'subscription-manager.js';
        script.onload = function() {
            applyFeatureGates();
        };
        document.head.appendChild(script);
    } else {
        applyFeatureGates();
    }
}

function applyFeatureGates() {
    // Add subscription status indicator
    addSubscriptionStatusIndicator();
    
    // Apply feature gates to existing functionality
    gateVoiceInput();
    gateExportFunctionality();
    gateAdvancedAnalytics();
    gateCompanyManagement();
    gateEmployeeManagement();
    
    // Add usage tracking to existing functions
    addUsageTracking();
    
    // Add upgrade buttons to premium features
    addUpgradePrompts();
}

function addSubscriptionStatusIndicator() {
    const tier = subscriptionManager.getUserTier();
    const tierData = subscriptionManager.tiers[tier];
    
    // Create subscription status bar
    const statusBar = document.createElement('div');
    statusBar.id = 'subscription-status-bar';
    statusBar.className = `subscription-status tier-${tier}`;
    statusBar.innerHTML = `
        <div class="subscription-status-content">
            <div class="tier-info">
                <span class="tier-badge">${tierData.name}</span>
                <span class="tier-price">LKR ${tierData.price}/month</span>
            </div>
            <div class="usage-info">
                <span class="usage-item">
                    Transactions: ${getUsageDisplay('transactions')}
                </span>
                <span class="usage-item">
                    Bank Accounts: ${getUsageDisplay('bankAccounts')}
                </span>
            </div>
            <div class="subscription-actions">
                ${tier === 'free' ? '<button class="upgrade-btn" onclick="subscriptionManager.showUpgradePrompt()">Upgrade</button>' : ''}
                <button class="manage-btn" onclick="showSubscriptionManager()">Manage</button>
            </div>
        </div>
    `;
    
    // Add to top of page
    document.body.insertBefore(statusBar, document.body.firstChild);
    
    // Add styles
    addSubscriptionStatusStyles();
}

function getUsageDisplay(type) {
    const remaining = subscriptionManager.getRemainingUsage(type);
    const usage = subscriptionManager.getUsageData();
    const current = usage[type] || 0;
    
    if (remaining === -1) {
        return `${current} (Unlimited)`;
    }
    
    const total = current + remaining;
    return `${current}/${total}`;
}

function gateVoiceInput() {
    // Find voice input elements
    const voiceButtons = document.querySelectorAll('[onclick*="voice"], [onclick*="Voice"], .voice-btn, #voiceInput');
    
    voiceButtons.forEach(button => {
        if (!subscriptionManager.hasFeatureAccess('voice_input')) {
            button.disabled = true;
            button.title = 'Voice input requires Personal Pro or higher';
            button.classList.add('feature-locked');
            
            // Add premium badge
            const badge = document.createElement('span');
            badge.className = 'premium-badge';
            badge.innerHTML = '👑 Premium';
            button.appendChild(badge);
            
            // Replace click handler
            button.onclick = function(e) {
                e.preventDefault();
                subscriptionManager.showUpgradePrompt('voice_input');
            };
        }
    });
}

function gateExportFunctionality() {
    // Find export buttons
    const exportButtons = document.querySelectorAll('[onclick*="export"], [onclick*="Export"], .export-btn, #exportData');
    
    exportButtons.forEach(button => {
        if (!subscriptionManager.hasFeatureAccess('export_data')) {
            button.disabled = true;
            button.title = 'Data export requires Personal Pro or higher';
            button.classList.add('feature-locked');
            
            // Add premium badge
            const badge = document.createElement('span');
            badge.className = 'premium-badge';
            badge.innerHTML = '👑 Premium';
            button.appendChild(badge);
            
            // Replace click handler
            button.onclick = function(e) {
                e.preventDefault();
                subscriptionManager.showUpgradePrompt('export_data');
            };
        }
    });
}

function gateAdvancedAnalytics() {
    // Find analytics elements
    const analyticsElements = document.querySelectorAll('.analytics-section, .advanced-analytics, #analyticsPanel');
    
    analyticsElements.forEach(element => {
        if (!subscriptionManager.hasFeatureAccess('ai_analytics')) {
            element.classList.add('feature-locked');
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.className = 'feature-lock-overlay';
            overlay.innerHTML = `
                <div class="lock-content">
                    <h3>👑 Premium Feature</h3>
                    <p>Advanced analytics require Personal Pro or higher</p>
                    <button class="upgrade-btn" onclick="subscriptionManager.showUpgradePrompt('ai_analytics')">
                        Upgrade Now
                    </button>
                </div>
            `;
            element.appendChild(overlay);
        }
    });
}

function gateCompanyManagement() {
    // Find company management elements
    const companyElements = document.querySelectorAll('[onclick*="company"], [onclick*="Company"], .company-btn, #companyManagement');
    
    companyElements.forEach(element => {
        if (!subscriptionManager.hasFeatureAccess('employee_management')) {
            element.disabled = true;
            element.title = 'Company management requires Business Starter plan or higher';
            element.classList.add('feature-locked');
            
            // Add business badge
            const badge = document.createElement('span');
            badge.className = 'business-badge';
            badge.innerHTML = '🏢 Business';
            element.appendChild(badge);
            
            // Replace click handler
            element.onclick = function(e) {
                e.preventDefault();
                subscriptionManager.showUpgradePrompt('employee_management');
            };
        }
    });
}

function gateEmployeeManagement() {
    // Find employee management elements
    const employeeElements = document.querySelectorAll('[onclick*="employee"], [onclick*="Employee"], .employee-btn, #employeeManagement');
    
    employeeElements.forEach(element => {
        if (!subscriptionManager.hasFeatureAccess('employee_management')) {
            element.disabled = true;
            element.title = 'Employee management requires Business Starter plan or higher';
            element.classList.add('feature-locked');
            
            // Add business badge
            const badge = document.createElement('span');
            badge.className = 'business-badge';
            badge.innerHTML = '🏢 Business';
            element.appendChild(badge);
            
            // Replace click handler
            element.onclick = function(e) {
                e.preventDefault();
                subscriptionManager.showUpgradePrompt('employee_management');
            };
        }
    });
}

function addUsageTracking() {
    // Track expense additions
    const originalAddExpense = window.addPersonalExpense;
    if (originalAddExpense) {
        window.addPersonalExpense = function() {
            if (subscriptionManager.trackUsage('transactions')) {
                return originalAddExpense.apply(this, arguments);
            }
        };
    }
    
    // Track company creation
    const originalCreateCompany = window.createNewCompany;
    if (originalCreateCompany) {
        window.createNewCompany = function() {
            if (subscriptionManager.trackUsage('companies')) {
                return originalCreateCompany.apply(this, arguments);
            }
        };
    }
    
    // Track employee addition
    const originalAddEmployee = window.addNewEmployee;
    if (originalAddEmployee) {
        window.addNewEmployee = function() {
            if (subscriptionManager.trackUsage('employees')) {
                return originalAddEmployee.apply(this, arguments);
            }
        };
    }
}

function addUpgradePrompts() {
    // Add upgrade prompts to free tier users
    const tier = subscriptionManager.getUserTier();
    
    if (tier === 'free') {
        // Add upgrade prompt to dashboard
        const upgradePrompt = document.createElement('div');
        upgradePrompt.className = 'upgrade-prompt-banner';
        upgradePrompt.innerHTML = `
            <div class="upgrade-prompt-content">
                <h3>🚀 Unlock More Features</h3>
                <p>Upgrade to Personal Pro for unlimited transactions, investment tracking, and AI categorization</p>
                <button class="upgrade-btn" onclick="subscriptionManager.upgradeToTier('personal')">
                    Upgrade for LKR 390/month
                </button>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add after header or at top of main content
        const mainContent = document.querySelector('main, .main-content, .container');
        if (mainContent) {
            mainContent.insertBefore(upgradePrompt, mainContent.firstChild);
        }
    }
}

function showSubscriptionManager() {
    const tier = subscriptionManager.getUserTier();
    const tierData = subscriptionManager.tiers[tier];
    const usage = subscriptionManager.getUsageData();
    
    const modal = document.createElement('div');
    modal.className = 'subscription-manager-modal';
    modal.innerHTML = `
        <div class="subscription-manager-backdrop" onclick="this.parentElement.remove()">
            <div class="subscription-manager-content" onclick="event.stopPropagation()">
                <div class="subscription-manager-header">
                    <h2>📊 Subscription Manager</h2>
                    <button class="close-btn" onclick="this.closest('.subscription-manager-modal').remove()">×</button>
                </div>
                <div class="subscription-manager-body">
                    <div class="current-plan-info">
                        <h3>Current Plan: ${tierData.name}</h3>
                        <p>LKR ${tierData.price}/month</p>
                        <div class="plan-features">
                            <h4>Features:</h4>
                            <ul>
                                ${tierData.features.map(f => `<li>✅ ${f.replace('_', ' ').toUpperCase()}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="usage-breakdown">
                        <h4>Usage This Month:</h4>
                        <div class="usage-items">
                            <div class="usage-item">
                                <span>Transactions:</span>
                                <span>${getUsageDisplay('transactions')}</span>
                            </div>
                            <div class="usage-item">
                                <span>Bank Accounts:</span>
                                <span>${getUsageDisplay('bankAccounts')}</span>
                            </div>
                            <div class="usage-item">
                                <span>Companies:</span>
                                <span>${getUsageDisplay('companies')}</span>
                            </div>
                            <div class="usage-item">
                                <span>Employees:</span>
                                <span>${getUsageDisplay('employees')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="plan-options">
                        <h4>Available Plans:</h4>
                        <div class="plans-grid">
                            ${Object.keys(subscriptionManager.tiers).map(tierKey => {
                                const tierInfo = subscriptionManager.tiers[tierKey];
                                const isCurrent = tierKey === tier;
                                return `
                                    <div class="plan-card ${isCurrent ? 'current' : ''}">
                                        <h5>${tierInfo.name}</h5>
                                        <p class="plan-price">LKR ${tierInfo.price}/month</p>
                                        <button class="plan-btn ${isCurrent ? 'current' : ''}" 
                                                ${isCurrent ? 'disabled' : `onclick="subscriptionManager.upgradeToTier('${tierKey}')"`}>
                                            ${isCurrent ? 'Current Plan' : 'Upgrade'}
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addSubscriptionManagerStyles();
}

function addSubscriptionStatusStyles() {
    if (document.getElementById('subscription-status-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'subscription-status-styles';
    styles.textContent = `
        .subscription-status {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .subscription-status.tier-starter {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        
        .subscription-status.tier-personal {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .subscription-status.tier-business {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .subscription-status.tier-professional {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }
        
        .subscription-status.tier-business {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        
        .subscription-status.tier-enterprise {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }
        
        .subscription-status-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            font-size: 0.9rem;
        }
        
        .tier-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .tier-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .usage-info {
            display: flex;
            gap: 1rem;
        }
        
        .usage-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        
        .subscription-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .upgrade-btn, .manage-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upgrade-btn:hover, .manage-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .feature-locked {
            opacity: 0.6;
            cursor: not-allowed !important;
            position: relative;
        }
        
        .premium-badge, .business-badge {
            position: absolute;
            top: -5px;
            right: -10px;
            background: #f59e0b;
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        
        .business-badge {
            background: #8b5cf6;
        }
        
        .feature-lock-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            z-index: 100;
        }
        
        .lock-content {
            text-align: center;
            color: white;
            padding: 2rem;
        }
        
        .lock-content h3 {
            margin-bottom: 1rem;
            color: #f59e0b;
        }
        
        .lock-content .upgrade-btn {
            background: #f59e0b;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
        }
        
        .upgrade-prompt-banner {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .upgrade-prompt-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        
        .upgrade-prompt-content h3 {
            margin: 0;
            font-size: 1.1rem;
        }
        
        .upgrade-prompt-content p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0.8;
        }
        
        .close-btn:hover {
            opacity: 1;
        }
        
        /* Adjust body padding for status bar */
        body {
            padding-top: 50px;
        }
        
        @media (max-width: 768px) {
            .subscription-status-content {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .usage-info {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .upgrade-prompt-content {
                flex-direction: column;
                text-align: center;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

function addSubscriptionManagerStyles() {
    if (document.getElementById('subscription-manager-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'subscription-manager-styles';
    styles.textContent = `
        .subscription-manager-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        }
        
        .subscription-manager-backdrop {
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
        
        .subscription-manager-content {
            background: white;
            border-radius: 16px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .subscription-manager-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .subscription-manager-body {
            padding: 2rem;
        }
        
        .current-plan-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        
        .plan-features ul {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
        }
        
        .plan-features li {
            padding: 0.25rem 0;
        }
        
        .usage-breakdown {
            margin-bottom: 2rem;
        }
        
        .usage-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .usage-item {
            display: flex;
            justify-content: space-between;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .plan-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
        }
        
        .plan-card:hover {
            border-color: #667eea;
        }
        
        .plan-card.current {
            border-color: #10b981;
            background: #f0fdf4;
        }
        
        .plan-price {
            font-size: 1.5rem;
            font-weight: 800;
            color: #667eea;
            margin: 1rem 0;
        }
        
        .plan-btn {
            width: 100%;
            padding: 0.75rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .plan-btn:not(.current) {
            background: #667eea;
            color: white;
        }
        
        .plan-btn:not(.current):hover {
            background: #5a67d8;
        }
        
        .plan-btn.current {
            background: #10b981;
            color: white;
            cursor: default;
        }
    `;
    
    document.head.appendChild(styles);
}