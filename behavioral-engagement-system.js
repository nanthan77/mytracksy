/**
 * MyTracksy Behavioral Engagement System
 * Smart timing system for engagement prompts and progressive achievement rewards
 * Implements behavioral psychology for maximum user engagement and retention
 */

class BehavioralEngagementSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupSmartTimingSystem();
        this.initializeAchievementSystem();
        this.trackUserBehaviorPatterns();
    }

    // Smart Timing System for Engagement Prompts
    setupSmartTimingSystem() {
        // Track user activity patterns
        this.trackPageFocus();
        this.trackScrollBehavior();
        this.trackClickPatterns();
        this.scheduleOptimalEngagementTimes();
    }

    trackPageFocus() {
        let focusStartTime = Date.now();
        let totalFocusTime = 0;

        window.addEventListener('focus', () => {
            focusStartTime = Date.now();
        });

        window.addEventListener('blur', () => {
            const sessionTime = Date.now() - focusStartTime;
            totalFocusTime += sessionTime;
            this.updateUserEngagementMetrics('focus_time', sessionTime);
        });

        // Optimal engagement timing based on focus patterns
        setInterval(() => {
            if (document.hasFocus() && totalFocusTime > 120000) { // 2+ minutes focused
                this.checkForOptimalEngagementMoment();
            }
        }, 30000); // Check every 30 seconds
    }

    trackScrollBehavior() {
        let scrollDepth = 0;
        let maxScrollDepth = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            scrollDepth = Math.round((currentScroll / documentHeight) * 100);
            
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                this.updateUserEngagementMetrics('scroll_depth', maxScrollDepth);
                
                // Trigger engagement at optimal scroll points
                if (maxScrollDepth > 60 && !this.hasShownScrollEngagement()) {
                    this.showScrollBasedEngagement();
                }
            }
        });
    }

    trackClickPatterns() {
        let clickCount = 0;
        let lastClickTime = 0;

        document.addEventListener('click', (event) => {
            const currentTime = Date.now();
            const timeSinceLastClick = currentTime - lastClickTime;
            
            clickCount++;
            lastClickTime = currentTime;
            
            // Detect engaged browsing behavior
            if (timeSinceLastClick < 5000 && clickCount % 5 === 0) { // 5 clicks within rapid succession
                this.scheduleEngagementPrompt('high_activity');
            }
            
            this.updateUserEngagementMetrics('click_count', clickCount);
        });
    }

    scheduleOptimalEngagementTimes() {
        // Morning engagement (9-11 AM)
        this.scheduleTimeBasedEngagement('09:00', 'morning_productivity');
        
        // Lunch break engagement (12-2 PM)
        this.scheduleTimeBasedEngagement('12:30', 'lunch_break');
        
        // Evening review (6-8 PM)
        this.scheduleTimeBasedEngagement('18:00', 'evening_review');
    }

    scheduleTimeBasedEngagement(time, context) {
        const [hour, minute] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
        
        if (scheduledTime < now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1); // Next day
        }
        
        const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            if (document.hasFocus()) {
                this.showTimeBasedEngagement(context);
            }
        }, timeUntilScheduled);
    }

    checkForOptimalEngagementMoment() {
        const userMetrics = this.getUserEngagementMetrics();
        const optimalScore = this.calculateOptimalEngagementScore(userMetrics);
        
        if (optimalScore > 75 && !this.hasRecentEngagement()) {
            this.showOptimalMomentEngagement();
        }
    }

    calculateOptimalEngagementScore(metrics) {
        let score = 0;
        
        // Focus time weight (40%)
        if (metrics.focus_time > 180000) score += 40; // 3+ minutes
        else if (metrics.focus_time > 120000) score += 25; // 2+ minutes
        
        // Scroll engagement weight (30%)
        if (metrics.scroll_depth > 70) score += 30;
        else if (metrics.scroll_depth > 40) score += 20;
        
        // Click activity weight (30%)
        if (metrics.click_count > 10) score += 30;
        else if (metrics.click_count > 5) score += 20;
        
        return score;
    }

    // Progressive Achievement System
    initializeAchievementSystem() {
        this.checkAchievements();
        this.setupAchievementTriggers();
    }

    setupAchievementTriggers() {
        // Expense tracking achievements
        this.trackExpenseAchievements();
        
        // Voice usage achievements
        this.trackVoiceAchievements();
        
        // Professional development achievements
        this.trackProfessionalAchievements();
        
        // Consistency achievements
        this.trackConsistencyAchievements();
    }

    trackExpenseAchievements() {
        const expenses = JSON.parse(localStorage.getItem('myTracksyPersonalExpenses') || '[]');
        
        const achievements = [
            { id: 'first_expense', threshold: 1, title: '💰 First Step!', description: 'Added your first expense!' },
            { id: 'expense_5', threshold: 5, title: '📊 Getting Started', description: 'Tracked 5 expenses!' },
            { id: 'expense_25', threshold: 25, title: '🎯 Building Habits', description: 'Tracked 25 expenses!' },
            { id: 'expense_100', threshold: 100, title: '🏆 Expense Master', description: 'Tracked 100 expenses!' },
            { id: 'expense_500', threshold: 500, title: '👑 Financial Guru', description: 'Tracked 500 expenses!' }
        ];
        
        achievements.forEach(achievement => {
            if (expenses.length >= achievement.threshold && !this.hasAchievement(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    trackVoiceAchievements() {
        const events = JSON.parse(localStorage.getItem('myTracksyBehavioralEvents') || '[]');
        const voiceUsage = events.filter(e => e.type.includes('voice')).length;
        
        const voiceAchievements = [
            { id: 'voice_first', threshold: 1, title: '🎤 Voice Pioneer!', description: 'Used voice input for the first time!' },
            { id: 'voice_10', threshold: 10, title: '🗣️ Voice Pro', description: 'Used voice input 10 times!' },
            { id: 'voice_50', threshold: 50, title: '🎙️ Voice Expert', description: 'Voice input master - 50 uses!' }
        ];
        
        voiceAchievements.forEach(achievement => {
            if (voiceUsage >= achievement.threshold && !this.hasAchievement(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    trackProfessionalAchievements() {
        const dashboardVisits = this.getTotalDashboardVisits();
        
        const professionalAchievements = [
            { id: 'professional_explorer', threshold: 3, title: '🔍 Professional Explorer', description: 'Explored multiple professional dashboards!' },
            { id: 'feature_discoverer', threshold: 5, title: '⭐ Feature Discoverer', description: 'Discovered advanced professional features!' }
        ];
        
        professionalAchievements.forEach(achievement => {
            if (dashboardVisits >= achievement.threshold && !this.hasAchievement(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    trackConsistencyAchievements() {
        const usageDays = this.getUsageDaysCount();
        
        const consistencyAchievements = [
            { id: 'consistent_3', threshold: 3, title: '📅 3-Day Streak', description: 'Used MyTracksy for 3 consecutive days!' },
            { id: 'consistent_7', threshold: 7, title: '🔥 Week Warrior', description: 'One week of consistent tracking!' },
            { id: 'consistent_30', threshold: 30, title: '🌟 Monthly Master', description: 'One month of financial discipline!' }
        ];
        
        consistencyAchievements.forEach(achievement => {
            if (usageDays >= achievement.threshold && !this.hasAchievement(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        // Save achievement
        const achievements = JSON.parse(localStorage.getItem('myTracksyAchievements') || '[]');
        achievements.push({
            ...achievement,
            unlockedAt: new Date().toISOString()
        });
        localStorage.setItem('myTracksyAchievements', JSON.stringify(achievements));
        
        // Show achievement popup
        this.showAchievementPopup(achievement);
        
        // Track achievement unlock
        this.trackBehavioralEvent('achievement_unlocked_' + achievement.id);
    }

    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 400px;
            width: 90%;
            z-index: 4000;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            animation: achievementBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            text-align: center;
        `;
        
        popup.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem; animation: achievementGlow 2s infinite alternate;">🏆</div>
            <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">Achievement Unlocked!</h2>
            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">${achievement.title}</h3>
            <p style="margin-bottom: 2rem; opacity: 0.9; line-height: 1.6;">${achievement.description}</p>
            <button onclick="this.closest('[style*=\"z-index: 4000\"]').remove()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid rgba(255,255,255,0.3);
                padding: 1rem 2rem;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                backdrop-filter: blur(10px);
                font-size: 1.1rem;
            ">Awesome!</button>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 5000);
    }

    // Engagement Methods
    showOptimalMomentEngagement() {
        const engagements = [
            {
                title: '💡 Smart Insight Ready',
                message: 'You\'re actively using MyTracksy! Want to see your spending patterns and save money?',
                action: () => this.openSpendingInsights()
            },
            {
                title: '🎯 Goal Achievement',
                message: 'You\'re building great financial habits! Ready to set a savings goal?',
                action: () => this.openGoalSetting()
            },
            {
                title: '📊 Professional Upgrade',
                message: 'You\'re getting serious about expense tracking! Unlock professional features?',
                action: () => this.openUpgradeFlow()
            }
        ];
        
        const randomEngagement = engagements[Math.floor(Math.random() * engagements.length)];
        this.showEngagementPopup(randomEngagement, 'optimal_moment');
    }

    showTimeBasedEngagement(context) {
        const contextEngagements = {
            morning_productivity: {
                title: '🌅 Morning Financial Check',
                message: 'Good morning! Start your day by reviewing yesterday\'s expenses.',
                action: () => this.openDailyReview()
            },
            lunch_break: {
                title: '🍽️ Lunch Break Tracking',
                message: 'Taking a break? Quick expense check takes just 30 seconds!',
                action: () => this.openQuickEntry()
            },
            evening_review: {
                title: '🌆 Evening Financial Review',
                message: 'End your day with a quick expense review. How did you do today?',
                action: () => this.openDailySummary()
            }
        };
        
        const engagement = contextEngagements[context];
        if (engagement) {
            this.showEngagementPopup(engagement, context);
        }
    }

    showScrollBasedEngagement() {
        const scrollEngagement = {
            title: '🚀 You\'re Engaged!',
            message: 'Since you\'re exploring MyTracksy, want to discover a hidden feature that could save you time?',
            action: () => this.showHiddenFeatureTour()
        };
        
        this.showEngagementPopup(scrollEngagement, 'scroll_based');
        localStorage.setItem('myTracksyScrollEngagementShown', 'true');
    }

    showEngagementPopup(engagement, type) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 420px;
            width: 90%;
            z-index: 3500;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            animation: engagementSlide 0.4s ease-out;
            text-align: center;
        `;
        
        popup.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">${engagement.title.split(' ')[0]}</div>
            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">${engagement.title.substring(engagement.title.indexOf(' ') + 1)}</h3>
            <p style="margin-bottom: 2rem; line-height: 1.6; opacity: 0.9;">${engagement.message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="handleEngagementAction('${type}')" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.3);
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                ">Let's Go!</button>
                <button onclick="dismissEngagement('${type}')" style="
                    background: transparent;
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                ">Not Now</button>
            </div>
        `;
        
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 3499;
            backdrop-filter: blur(3px);
        `;
        
        backdrop.onclick = () => this.dismissEngagement(type);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(popup);
        
        window.currentEngagementAction = engagement.action;
        window.currentEngagementType = type;
        
        // Mark engagement as shown
        this.markEngagementShown(type);
    }

    // Helper Methods
    getUserEngagementMetrics() {
        return JSON.parse(localStorage.getItem('myTracksyEngagementMetrics') || '{}');
    }

    updateUserEngagementMetrics(metric, value) {
        const metrics = this.getUserEngagementMetrics();
        metrics[metric] = value;
        metrics.lastUpdated = new Date().toISOString();
        localStorage.setItem('myTracksyEngagementMetrics', JSON.stringify(metrics));
    }

    hasRecentEngagement() {
        const lastEngagement = localStorage.getItem('myTracksyLastEngagement');
        if (!lastEngagement) return false;
        
        const lastTime = new Date(lastEngagement).getTime();
        const now = new Date().getTime();
        return (now - lastTime) < 1800000; // 30 minutes
    }

    hasScrollEngagementShown() {
        return localStorage.getItem('myTracksyScrollEngagementShown') === 'true';
    }

    markEngagementShown(type) {
        localStorage.setItem('myTracksyLastEngagement', new Date().toISOString());
        localStorage.setItem(`myTracksyEngagement_${type}`, new Date().toISOString());
    }

    hasAchievement(achievementId) {
        const achievements = JSON.parse(localStorage.getItem('myTracksyAchievements') || '[]');
        return achievements.some(a => a.id === achievementId);
    }

    getTotalDashboardVisits() {
        const retail = parseInt(localStorage.getItem('myTracksyRetailVisits') || '0');
        const transport = parseInt(localStorage.getItem('myTracksyTransportVisits') || '0');
        return retail + transport;
    }

    getUsageDaysCount() {
        const events = JSON.parse(localStorage.getItem('myTracksyBehavioralEvents') || '[]');
        const uniqueDays = new Set(events.map(e => e.timestamp.split('T')[0]));
        return uniqueDays.size;
    }

    trackBehavioralEvent(eventType) {
        const events = JSON.parse(localStorage.getItem('myTracksyBehavioralEvents') || '[]');
        events.push({
            type: eventType,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        });
        localStorage.setItem('myTracksyBehavioralEvents', JSON.stringify(events));
    }

    // Action Methods
    openSpendingInsights() {
        window.location.href = 'user-profile.html#insights';
    }

    openGoalSetting() {
        window.location.href = 'individual-dashboard.html#goals';
    }

    openUpgradeFlow() {
        window.location.href = 'user-profile.html#upgrade';
    }

    openDailyReview() {
        window.location.href = 'individual-dashboard.html#review';
    }

    openQuickEntry() {
        if (typeof addPersonalExpense === 'function') {
            addPersonalExpense();
        }
    }

    openDailySummary() {
        window.location.href = 'individual-dashboard.html#summary';
    }

    showHiddenFeatureTour() {
        alert('🎉 Hidden Feature: Voice commands work in any language! Try saying your expense in Sinhala or Tamil!');
    }

    dismissEngagement(type) {
        const popup = document.querySelector('[style*="z-index: 3500"]');
        const backdrop = document.querySelector('[style*="z-index: 3499"]');
        
        if (popup) popup.remove();
        if (backdrop) backdrop.remove();
        
        this.trackBehavioralEvent('engagement_dismissed_' + type);
    }

    checkAchievements() {
        this.trackExpenseAchievements();
        this.trackVoiceAchievements();
        this.trackProfessionalAchievements();
        this.trackConsistencyAchievements();
    }
}

// Global functions for popup interactions
window.handleEngagementAction = function(type) {
    if (window.currentEngagementAction) {
        window.currentEngagementAction();
    }
    
    const popup = document.querySelector('[style*="z-index: 3500"]');
    const backdrop = document.querySelector('[style*="z-index: 3499"]');
    
    if (popup) popup.remove();
    if (backdrop) backdrop.remove();
    
    // Track engagement
    const behavioralSystem = new BehavioralEngagementSystem();
    behavioralSystem.trackBehavioralEvent('engagement_activated_' + type);
};

window.dismissEngagement = function(type) {
    const popup = document.querySelector('[style*="z-index: 3500"]');
    const backdrop = document.querySelector('[style*="z-index: 3499"]');
    
    if (popup) popup.remove();
    if (backdrop) backdrop.remove();
    
    // Track dismissal
    const behavioralSystem = new BehavioralEngagementSystem();
    behavioralSystem.trackBehavioralEvent('engagement_dismissed_' + type);
};

// CSS Animations
const engagementStyle = document.createElement('style');
engagementStyle.textContent = `
    @keyframes achievementBounce {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); 
        }
        50% { 
            transform: translate(-50%, -50%) scale(1.1) rotate(5deg); 
        }
        100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1) rotate(0deg); 
        }
    }
    
    @keyframes achievementGlow {
        from { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        to { text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8); }
    }
    
    @keyframes engagementSlide {
        from { 
            opacity: 0; 
            transform: translate(-50%, -60%) scale(0.9); 
        }
        to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
        }
    }
`;
document.head.appendChild(engagementStyle);

// Initialize the system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const behavioralSystem = new BehavioralEngagementSystem();
    window.behavioralEngagementSystem = behavioralSystem;
});