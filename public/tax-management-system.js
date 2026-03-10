/**
 * MyTracksy Tax Management System
 * Comprehensive Sri Lankan tax compliance and management
 */

class TaxManagementSystem {
    constructor() {
        this.taxEngine = new SriLankanTaxEngine();
        this.initializeFirebase();
        this.loadUserTaxData();
    }

    initializeFirebase() {
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyBKJoVWvlp5EttjcHvgd-8PBvb8v7m59ZI",
            authDomain: "tracksy-8e30c.firebaseapp.com",
            projectId: "tracksy-8e30c",
            storageBucket: "tracksy-8e30c.appspot.com",
            messagingSenderId: "941924690758",
            appId: "1:941924690758:web:ac3e5c4fc9aac58a5c9347"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        this.auth = firebase.auth();
        this.db = firebase.firestore();
    }

    async loadUserTaxData() {
        if (!this.auth.currentUser) {
            console.log('No user logged in');
            return;
        }

        try {
            const userId = this.auth.currentUser.uid;
            const taxDoc = await this.db.collection('userTaxData').doc(userId).get();
            
            if (taxDoc.exists()) {
                this.userTaxData = taxDoc.data();
            } else {
                // Initialize default tax data
                this.userTaxData = {
                    tin: '',
                    vatRegistered: false,
                    currentRevenue: 0,
                    whtYTD: 0,
                    taxYear: '2024/2025',
                    filingReminders: [],
                    createdAt: new Date().toISOString()
                };
                await this.saveTaxData();
            }
        } catch (error) {
            console.error('Error loading tax data:', error);
        }
    }

    async saveTaxData() {
        if (!this.auth.currentUser) return;

        try {
            const userId = this.auth.currentUser.uid;
            await this.db.collection('userTaxData').doc(userId).set({
                ...this.userTaxData,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving tax data:', error);
        }
    }

    // Income Tax Calculator (with personal relief)
    calculateIncomeTax(annualIncome) {
        // Apply personal relief of LKR 3 million
        const personalRelief = 3000000;
        const taxableIncome = Math.max(0, annualIncome - personalRelief);
        
        // Calculate tax using progressive brackets
        const brackets = [
            { min: 0, max: 500000, rate: 0.06 },
            { min: 500000, max: 1000000, rate: 0.12 },
            { min: 1000000, max: 1500000, rate: 0.18 },
            { min: 1500000, max: 2000000, rate: 0.24 },
            { min: 2000000, max: 2500000, rate: 0.30 },
            { min: 2500000, max: Infinity, rate: 0.36 }
        ];
        
        let totalTax = 0;
        let remainingIncome = taxableIncome;
        
        for (let bracket of brackets) {
            if (remainingIncome <= 0) break;
            
            const bracketSize = bracket.max === Infinity ? remainingIncome : (bracket.max - bracket.min);
            const taxableInBracket = Math.min(remainingIncome, bracketSize);
            const taxInBracket = taxableInBracket * bracket.rate;
            
            totalTax += taxInBracket;
            remainingIncome -= taxableInBracket;
        }
        
        const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) : 0;
        
        return {
            annualIncome: annualIncome,
            personalRelief: personalRelief,
            taxableIncome: taxableIncome,
            totalTax: totalTax,
            netIncome: annualIncome - totalTax,
            effectiveRate: effectiveRate,
            monthlyTax: totalTax / 12,
            nextInstallment: this.getNextInstallmentDate(),
            filingDeadline: this.getFiscalYearEnd()
        };
    }

    // VAT Registration Checker
    checkVATRegistration(annualRevenue) {
        const threshold = this.taxEngine.taxRates.vat.registrationThreshold;
        const required = annualRevenue >= threshold;
        
        return {
            required: required,
            threshold: threshold,
            currentRevenue: annualRevenue,
            percentageOfThreshold: (annualRevenue / threshold) * 100,
            registrationStatus: this.userTaxData.vatRegistered ? 'Registered' : 'Not Registered',
            recommendation: required ? 'VAT registration required' : 'VAT registration not required'
        };
    }

    // Withholding Tax Tracker
    calculateWithholdingTax(income, type = 'serviceFees') {
        const whtRules = this.taxEngine.taxRates.wht[type];
        if (!whtRules) return null;

        const taxableAmount = Math.max(0, income - whtRules.threshold);
        const whtAmount = taxableAmount * whtRules.rate;

        return {
            income: income,
            threshold: whtRules.threshold,
            taxableAmount: taxableAmount,
            rate: whtRules.rate,
            whtAmount: whtAmount,
            ytdTotal: this.userTaxData.whtYTD + whtAmount
        };
    }

    // Filing Reminder System
    getFilingReminders() {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        const reminders = [
            {
                type: 'Income Tax',
                dueDate: new Date(`${currentYear + 1}-03-31`),
                description: 'Annual Income Tax Return',
                priority: 'high',
                daysLeft: this.calculateDaysLeft(new Date(`${currentYear + 1}-03-31`))
            },
            {
                type: 'VAT Return',
                dueDate: this.getNextVATDueDate(),
                description: 'Monthly VAT Return',
                priority: 'medium',
                daysLeft: this.calculateDaysLeft(this.getNextVATDueDate())
            },
            {
                type: 'WHT Payment',
                dueDate: this.getNextWHTDueDate(),
                description: 'Withholding Tax Payment',
                priority: 'medium',
                daysLeft: this.calculateDaysLeft(this.getNextWHTDueDate())
            }
        ];

        return reminders.filter(r => r.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft);
    }

    calculateDaysLeft(dueDate) {
        const today = new Date();
        const diff = dueDate.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    }

    getNextVATDueDate() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 20);
        return nextMonth;
    }

    getNextWHTDueDate() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 20);
        return nextMonth;
    }

    getNextInstallmentDate() {
        const today = new Date();
        const installmentDates = [
            new Date(today.getFullYear(), 7, 15), // Aug 15
            new Date(today.getFullYear(), 10, 15), // Nov 15
            new Date(today.getFullYear() + 1, 1, 15), // Feb 15
            new Date(today.getFullYear() + 1, 4, 15)  // May 15
        ];

        return installmentDates.find(date => date > today) || installmentDates[0];
    }

    getFiscalYearEnd() {
        const today = new Date();
        const fiscalYearEnd = new Date(today.getFullYear() + 1, 2, 31); // March 31
        return fiscalYearEnd;
    }

    // Update user tax information
    async updateTIN(tin) {
        this.userTaxData.tin = tin;
        await this.saveTaxData();
        return true;
    }

    async updateVATRegistration(isRegistered) {
        this.userTaxData.vatRegistered = isRegistered;
        await this.saveTaxData();
        return true;
    }

    async addIncome(amount, type = 'salary', description = '') {
        if (!this.userTaxData.incomes) {
            this.userTaxData.incomes = [];
        }

        const income = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            type: type,
            description: description,
            date: new Date().toISOString(),
            taxYear: this.userTaxData.taxYear
        };

        this.userTaxData.incomes.push(income);
        this.userTaxData.currentRevenue = this.calculateTotalRevenue();
        await this.saveTaxData();
        return income;
    }

    async addWHTPayment(amount, type, description = '') {
        if (!this.userTaxData.whtPayments) {
            this.userTaxData.whtPayments = [];
        }

        const payment = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            type: type,
            description: description,
            date: new Date().toISOString(),
            taxYear: this.userTaxData.taxYear
        };

        this.userTaxData.whtPayments.push(payment);
        this.userTaxData.whtYTD = this.calculateWHTYTD();
        await this.saveTaxData();
        return payment;
    }

    calculateTotalRevenue() {
        if (!this.userTaxData.incomes) return 0;
        return this.userTaxData.incomes.reduce((total, income) => {
            return total + income.amount;
        }, 0);
    }

    calculateWHTYTD() {
        if (!this.userTaxData.whtPayments) return 0;
        return this.userTaxData.whtPayments.reduce((total, payment) => {
            return total + payment.amount;
        }, 0);
    }

    // Format currency for Sri Lankan Rupees
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Generate tax reports
    generateTaxReport() {
        const totalIncome = this.calculateTotalRevenue();
        const incomeTax = this.calculateIncomeTax(totalIncome);
        const vatStatus = this.checkVATRegistration(totalIncome);
        const whtSummary = {
            ytdAmount: this.userTaxData.whtYTD,
            estimatedAnnual: this.userTaxData.whtYTD * (12 / new Date().getMonth() + 1)
        };

        return {
            taxYear: this.userTaxData.taxYear,
            totalIncome: totalIncome,
            incomeTax: incomeTax,
            vatStatus: vatStatus,
            whtSummary: whtSummary,
            filingReminders: this.getFilingReminders(),
            generatedAt: new Date().toISOString()
        };
    }
}

// Initialize global tax management system
let taxManager;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                taxManager = new TaxManagementSystem();
                updateTaxDashboard();
            }
        });
    }
});

// Update tax dashboard with real data
async function updateTaxDashboard() {
    if (!taxManager) return;

    try {
        const report = taxManager.generateTaxReport();
        
        // Update Income Tax Status
        updateIncomeTaxStatus(report.incomeTax);
        
        // Update VAT Registration Status
        updateVATStatus(report.vatStatus);
        
        // Update WHT Tracker
        updateWHTStatus(report.whtSummary);
        
        // Update Filing Reminders
        updateFilingReminders(report.filingReminders);
        
    } catch (error) {
        console.error('Error updating tax dashboard:', error);
    }
}

function updateIncomeTaxStatus(incomeTaxData) {
    const statusEl = document.getElementById('incomeTaxStatus');
    const tinEl = document.getElementById('userTIN');
    const taxYearEl = document.getElementById('taxYear');
    
    if (statusEl) {
        statusEl.textContent = taxManager.userTaxData.tin ? 'Registered' : 'Not Registered';
        statusEl.className = taxManager.userTaxData.tin ? 'status-active' : 'status-inactive';
    }
    
    if (tinEl) {
        tinEl.textContent = taxManager.userTaxData.tin || 'Not Set';
    }
    
    if (taxYearEl) {
        taxYearEl.textContent = taxManager.userTaxData.taxYear;
    }
}

function updateVATStatus(vatData) {
    const statusEl = document.getElementById('vatStatus');
    const revenueEl = document.getElementById('currentRevenue');
    const thresholdEl = document.getElementById('vatThreshold');
    
    if (statusEl) {
        statusEl.textContent = vatData.required ? 'Required' : 'Not Required';
        statusEl.className = vatData.required ? 'status-warning' : 'status-success';
    }
    
    if (revenueEl) {
        revenueEl.textContent = taxManager.formatCurrency(vatData.currentRevenue);
    }
    
    if (thresholdEl) {
        thresholdEl.textContent = taxManager.formatCurrency(vatData.threshold);
    }
}

function updateWHTStatus(whtData) {
    const ytdEl = document.getElementById('whtYTD');
    const estimatedEl = document.getElementById('whtEstimated');
    
    if (ytdEl) {
        ytdEl.textContent = taxManager.formatCurrency(whtData.ytdAmount);
    }
    
    if (estimatedEl) {
        estimatedEl.textContent = taxManager.formatCurrency(whtData.estimatedAnnual);
    }
}

function updateFilingReminders(reminders) {
    const container = document.getElementById('filingReminders');
    if (!container) return;
    
    container.innerHTML = '';
    
    reminders.forEach(reminder => {
        const reminderEl = document.createElement('div');
        reminderEl.className = `reminder-item priority-${reminder.priority}`;
        reminderEl.innerHTML = `
            <div class="reminder-type">${reminder.type}</div>
            <div class="reminder-desc">${reminder.description}</div>
            <div class="reminder-days">${reminder.daysLeft} days left</div>
            <div class="reminder-date">${reminder.dueDate.toLocaleDateString()}</div>
        `;
        container.appendChild(reminderEl);
    });
}

// Modal functions for tax management
function openTaxCalculator() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Income Tax Calculator</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Annual Income (LKR)</label>
                    <input type="number" id="annualIncome" placeholder="Enter your annual income">
                </div>
                <button onclick="calculateTax()" class="btn btn-primary">Calculate Tax</button>
                <div id="taxResults" class="tax-results"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function calculateTax() {
    const income = parseFloat(document.getElementById('annualIncome').value);
    if (!income) {
        alert('Please enter a valid income amount');
        return;
    }
    
    const taxData = taxManager.calculateIncomeTax(income);
    const resultsEl = document.getElementById('taxResults');
    
    resultsEl.innerHTML = `
        <h4>Tax Calculation Results</h4>
        <div class="result-item">
            <span>Personal Relief:</span>
            <span>${taxManager.formatCurrency(taxData.personalRelief)}</span>
        </div>
        <div class="result-item">
            <span>Taxable Income:</span>
            <span>${taxManager.formatCurrency(taxData.taxableIncome)}</span>
        </div>
        <div class="result-item">
            <span>Total Tax:</span>
            <span>${taxManager.formatCurrency(taxData.totalTax)}</span>
        </div>
        <div class="result-item">
            <span>Monthly Tax:</span>
            <span>${taxManager.formatCurrency(taxData.monthlyTax)}</span>
        </div>
        <div class="result-item">
            <span>Effective Rate:</span>
            <span>${(taxData.effectiveRate * 100).toFixed(2)}%</span>
        </div>
        <div class="result-item">
            <span>Next Installment:</span>
            <span>${taxData.nextInstallment.toLocaleDateString()}</span>
        </div>
    `;
}

function openVATChecker() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>VAT Registration Checker</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Annual Revenue (LKR)</label>
                    <input type="number" id="annualRevenue" placeholder="Enter your annual revenue">
                </div>
                <button onclick="checkVAT()" class="btn btn-primary">Check VAT Status</button>
                <div id="vatResults" class="vat-results"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function checkVAT() {
    const revenue = parseFloat(document.getElementById('annualRevenue').value);
    if (!revenue) {
        alert('Please enter a valid revenue amount');
        return;
    }
    
    const vatData = taxManager.checkVATRegistration(revenue);
    const resultsEl = document.getElementById('vatResults');
    
    resultsEl.innerHTML = `
        <h4>VAT Registration Status</h4>
        <div class="result-item">
            <span>Registration Required:</span>
            <span class="${vatData.required ? 'status-warning' : 'status-success'}">${vatData.required ? 'YES' : 'NO'}</span>
        </div>
        <div class="result-item">
            <span>Threshold:</span>
            <span>${taxManager.formatCurrency(vatData.threshold)}</span>
        </div>
        <div class="result-item">
            <span>Your Revenue:</span>
            <span>${taxManager.formatCurrency(vatData.currentRevenue)}</span>
        </div>
        <div class="result-item">
            <span>Percentage of Threshold:</span>
            <span>${vatData.percentageOfThreshold.toFixed(1)}%</span>
        </div>
        <div class="recommendation">
            <strong>Recommendation:</strong> ${vatData.recommendation}
        </div>
    `;
}

function openWHTTracker() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Withholding Tax Tracker</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Income Amount (LKR)</label>
                    <input type="number" id="whtIncome" placeholder="Enter income amount">
                </div>
                <div class="form-group">
                    <label>Income Type</label>
                    <select id="whtType">
                        <option value="serviceFees">Service Fees</option>
                        <option value="interestIncome">Interest Income</option>
                        <option value="rent">Rent</option>
                        <option value="dividends">Dividends</option>
                        <option value="royalties">Royalties</option>
                    </select>
                </div>
                <button onclick="calculateWHT()" class="btn btn-primary">Calculate WHT</button>
                <div id="whtResults" class="wht-results"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function calculateWHT() {
    const income = parseFloat(document.getElementById('whtIncome').value);
    const type = document.getElementById('whtType').value;
    
    if (!income) {
        alert('Please enter a valid income amount');
        return;
    }
    
    const whtData = taxManager.calculateWithholdingTax(income, type);
    const resultsEl = document.getElementById('whtResults');
    
    resultsEl.innerHTML = `
        <h4>Withholding Tax Calculation</h4>
        <div class="result-item">
            <span>Income Amount:</span>
            <span>${taxManager.formatCurrency(whtData.income)}</span>
        </div>
        <div class="result-item">
            <span>Threshold:</span>
            <span>${taxManager.formatCurrency(whtData.threshold)}</span>
        </div>
        <div class="result-item">
            <span>Taxable Amount:</span>
            <span>${taxManager.formatCurrency(whtData.taxableAmount)}</span>
        </div>
        <div class="result-item">
            <span>WHT Rate:</span>
            <span>${(whtData.rate * 100).toFixed(1)}%</span>
        </div>
        <div class="result-item">
            <span>WHT Amount:</span>
            <span>${taxManager.formatCurrency(whtData.whtAmount)}</span>
        </div>
        <div class="result-item">
            <span>YTD Total:</span>
            <span>${taxManager.formatCurrency(whtData.ytdTotal)}</span>
        </div>
    `;
}

function openFilingReminders() {
    const reminders = taxManager.getFilingReminders();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Filing Reminders</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="reminders-list">
                    ${reminders.map(reminder => `
                        <div class="reminder-card priority-${reminder.priority}">
                            <h4>${reminder.type}</h4>
                            <p>${reminder.description}</p>
                            <div class="reminder-meta">
                                <span class="due-date">Due: ${reminder.dueDate.toLocaleDateString()}</span>
                                <span class="days-left ${reminder.daysLeft <= 7 ? 'urgent' : ''}">${reminder.daysLeft} days left</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button onclick="setReminders()" class="btn btn-primary">Set Email Reminders</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setReminders() {
    // Here you would implement email reminder functionality
    alert('Email reminders will be set for all upcoming filing deadlines!');
}