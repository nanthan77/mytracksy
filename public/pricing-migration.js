// MyTracksy Pricing Migration Script
// Migrates users from old pricing structure to new one

class PricingMigration {
    constructor() {
        this.oldToNewMapping = {
            'free': 'starter',
            'freemium': 'personal', 
            'premium': 'personal',
            'business': 'business',
            'enterprise': 'professional',
            'student': 'personal' // With student discount
        };

        this.migrationOffers = {
            'free': {
                newTier: 'starter',
                offer: 'Your free plan continues with more features!'
            },
            'freemium': {
                newTier: 'personal',
                offer: '50% off for 6 months on your new Personal Pro plan'
            },
            'premium': {
                newTier: 'personal', 
                offer: 'Same great features at a lower price - LKR 390/month'
            },
            'business': {
                newTier: 'business',
                offer: 'More features at LKR 1,200/month (was LKR 2,499)'
            },
            'enterprise': {
                newTier: 'professional',
                offer: 'Premium features at LKR 2,500/month (was LKR 9,999)'
            },
            'student': {
                newTier: 'personal',
                offer: '50% student discount - LKR 195/month'
            }
        };
    }

    // Check if user needs migration
    checkMigrationStatus() {
        const subscription = JSON.parse(localStorage.getItem('mytracksy_subscription') || '{}');
        const currentTier = subscription.tier;
        
        // Check if current tier is from old system
        const needsMigration = ['free', 'freemium', 'premium', 'business', 'enterprise', 'student'].includes(currentTier);
        
        return {
            needsMigration,
            currentTier,
            newTier: this.oldToNewMapping[currentTier],
            offer: this.migrationOffers[currentTier]
        };
    }

    // Perform automatic migration
    performMigration() {
        const migrationStatus = this.checkMigrationStatus();
        
        if (!migrationStatus.needsMigration) {
            console.log('No migration needed');
            return false;
        }

        const subscription = JSON.parse(localStorage.getItem('mytracksy_subscription') || '{}');
        
        // Update subscription with new tier
        subscription.tier = migrationStatus.newTier;
        subscription.migrated = true;
        subscription.migrationDate = new Date().toISOString();
        subscription.oldTier = migrationStatus.currentTier;
        
        // Add migration benefits
        if (migrationStatus.currentTier !== 'free') {
            subscription.migrationDiscount = 50; // 50% discount for 6 months
            subscription.migrationDiscountExpiry = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        // Save updated subscription
        localStorage.setItem('mytracksy_subscription', JSON.stringify(subscription));
        
        console.log('Migration completed:', migrationStatus);
        return true;
    }

    // Show migration modal to user
    showMigrationModal() {
        const migrationStatus = this.checkMigrationStatus();
        
        if (!migrationStatus.needsMigration) return;

        const modal = document.createElement('div');
        modal.className = 'migration-modal';
        modal.innerHTML = `
            <div class="migration-modal-backdrop">
                <div class="migration-modal-content">
                    <div class="migration-header">
                        <h2>🎉 Great News! Your Plan Got Better</h2>
                    </div>
                    <div class="migration-body">
                        <div class="migration-comparison">
                            <div class="old-plan">
                                <h3>Your Previous Plan</h3>
                                <p class="plan-name">${migrationStatus.currentTier.charAt(0).toUpperCase() + migrationStatus.currentTier.slice(1)}</p>
                            </div>
                            <div class="arrow">→</div>
                            <div class="new-plan">
                                <h3>Your New Plan</h3>
                                <p class="plan-name">${migrationStatus.newTier.charAt(0).toUpperCase() + migrationStatus.newTier.slice(1)}</p>
                            </div>
                        </div>
                        
                        <div class="migration-benefits">
                            <h4>✨ What's New:</h4>
                            <ul>
                                <li>✅ Better pricing designed for Sri Lankan market</li>
                                <li>✅ More features and improved limits</li>
                                <li>✅ Enhanced user experience</li>
                                <li>✅ Local payment methods (PayHere)</li>
                            </ul>
                        </div>
                        
                        <div class="special-offer">
                            <h4>🎁 Special Migration Offer:</h4>
                            <p>${migrationStatus.offer?.offer || 'Welcome to your new plan!'}</p>
                        </div>
                        
                        <div class="migration-actions">
                            <button class="btn-accept" onclick="pricingMigration.acceptMigration()">
                                Accept New Plan
                            </button>
                            <button class="btn-learn-more" onclick="window.open('new-pricing-display.html', '_blank')">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addMigrationStyles();
    }

    // Accept migration and close modal
    acceptMigration() {
        this.performMigration();
        
        // Remove modal
        const modal = document.querySelector('.migration-modal');
        if (modal) {
            modal.remove();
        }
        
        // Show success message
        this.showMigrationSuccess();
        
        // Refresh page to apply new subscription
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // Show migration success
    showMigrationSuccess() {
        const notification = document.createElement('div');
        notification.className = 'migration-success';
        notification.innerHTML = `
            <div class="success-content">
                <h3>🎉 Migration Successful!</h3>
                <p>Your new plan is now active. Enjoy the enhanced features!</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add styles for migration modal
    addMigrationStyles() {
        if (document.getElementById('migration-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'migration-styles';
        styles.textContent = `
            .migration-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            
            .migration-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            }
            
            .migration-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            }
            
            .migration-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 2rem;
                border-radius: 20px 20px 0 0;
                text-align: center;
            }
            
            .migration-header h2 {
                margin: 0;
                font-size: 1.8rem;
            }
            
            .migration-body {
                padding: 2rem;
            }
            
            .migration-comparison {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .old-plan, .new-plan {
                flex: 1;
                padding: 1rem;
                border-radius: 12px;
            }
            
            .old-plan {
                background: #f1f5f9;
                border: 2px solid #e2e8f0;
            }
            
            .new-plan {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            
            .arrow {
                font-size: 2rem;
                color: #10b981;
                margin: 0 1rem;
            }
            
            .plan-name {
                font-size: 1.3rem;
                font-weight: 700;
                margin: 0.5rem 0;
            }
            
            .migration-benefits {
                background: #f0fdf4;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
                border-left: 4px solid #10b981;
            }
            
            .migration-benefits h4 {
                color: #166534;
                margin-bottom: 1rem;
            }
            
            .migration-benefits ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .migration-benefits li {
                padding: 0.5rem 0;
                color: #166534;
            }
            
            .special-offer {
                background: #fef3c7;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 2rem;
                border-left: 4px solid #f59e0b;
            }
            
            .special-offer h4 {
                color: #92400e;
                margin-bottom: 0.5rem;
            }
            
            .special-offer p {
                color: #92400e;
                margin: 0;
                font-weight: 600;
            }
            
            .migration-actions {
                display: flex;
                gap: 1rem;
            }
            
            .btn-accept {
                flex: 2;
                background: #10b981;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-accept:hover {
                background: #059669;
                transform: translateY(-2px);
            }
            
            .btn-learn-more {
                flex: 1;
                background: #f8fafc;
                color: #374151;
                border: 2px solid #e5e7eb;
                padding: 1rem 2rem;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-learn-more:hover {
                background: #e5e7eb;
            }
            
            .migration-success {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 1rem 2rem;
                border-radius: 12px;
                z-index: 10001;
                animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @media (max-width: 600px) {
                .migration-comparison {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .arrow {
                    transform: rotate(90deg);
                }
                
                .migration-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Auto-initialize migration check
    autoCheck() {
        // Check on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.checkAndShowMigration(), 1000);
            });
        } else {
            setTimeout(() => this.checkAndShowMigration(), 1000);
        }
    }

    checkAndShowMigration() {
        const migrationStatus = this.checkMigrationStatus();
        if (migrationStatus.needsMigration) {
            this.showMigrationModal();
        }
    }
}

// Initialize migration system
const pricingMigration = new PricingMigration();

// Auto-check for migration needs
pricingMigration.autoCheck();

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PricingMigration;
}