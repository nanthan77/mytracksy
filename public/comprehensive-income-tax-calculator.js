/**
 * Comprehensive Sri Lankan Income Tax Calculator
 * For 2024/2025 Tax Year with all deductions and reliefs
 */

class ComprehensiveIncomeTaxCalculator {
    constructor() {
        this.initializeTaxRules();
    }

    initializeTaxRules() {
        this.taxRules = {
            // Personal Relief (Updated for 2024/2025)
            personalRelief: 3000000, // LKR 3 million
            
            // Progressive Tax Brackets (2024/2025)
            brackets: [
                { min: 0, max: 500000, rate: 0.06 },           // 6% on first LKR 500K
                { min: 500000, max: 1000000, rate: 0.12 },     // 12% on next LKR 500K  
                { min: 1000000, max: 1500000, rate: 0.18 },    // 18% on next LKR 500K
                { min: 1500000, max: 2000000, rate: 0.24 },    // 24% on next LKR 500K
                { min: 2000000, max: 2500000, rate: 0.30 },    // 30% on next LKR 500K
                { min: 2500000, max: Infinity, rate: 0.36 }    // 36% on balance above LKR 2.5M
            ],
            
            // Allowable Deductions and Reliefs
            deductions: {
                // EPF Contributions (Employee portion)
                epfContributions: {
                    maxAllowable: 1440000, // 8% of LKR 18M or actual, whichever is lower
                    description: 'Employee Provident Fund contributions'
                },
                
                // Life Insurance Premiums
                lifeInsurance: {
                    maxAllowable: 100000, // Maximum LKR 100,000 per year
                    description: 'Life insurance premiums paid'
                },
                
                // Approved Pension Schemes
                approvedPension: {
                    maxAllowable: 1440000, // Same as EPF
                    description: 'Contributions to approved pension schemes'
                },
                
                // Donations to Approved Charities
                charitableDonations: {
                    maxPercentage: 0.25, // 25% of assessable income or actual, whichever is lower
                    description: 'Donations to approved charitable institutions'
                },
                
                // Medical Expenses (for self, spouse, children)
                medicalExpenses: {
                    maxAllowable: 100000, // Maximum LKR 100,000 per year
                    description: 'Medical expenses for self, spouse, and children'
                },
                
                // Educational Expenses (for children)
                educationExpenses: {
                    maxAllowable: 200000, // Maximum LKR 200,000 per year
                    description: 'Educational expenses for children'
                },
                
                // Interest on Housing Loans
                housingLoanInterest: {
                    maxAllowable: 300000, // Maximum LKR 300,000 per year
                    description: 'Interest paid on housing loans'
                },
                
                // Maintenance of Parents (above 65 years)
                parentMaintenance: {
                    maxAllowable: 150000, // Maximum LKR 150,000 per year
                    description: 'Maintenance of parents above 65 years'
                }
            }
        };
    }

    calculateComprehensiveIncomeTax(incomeDetails, deductionDetails) {
        // Step 1: Calculate Total Income
        const totalIncome = this.calculateTotalIncome(incomeDetails);
        
        // Step 2: Calculate Total Allowable Deductions
        const totalDeductions = this.calculateTotalDeductions(deductionDetails, totalIncome);
        
        // Step 3: Calculate Taxable Income (after personal relief)
        const taxableIncome = Math.max(0, totalIncome - totalDeductions.total - this.taxRules.personalRelief);
        
        // Step 4: Calculate Tax using Progressive Brackets
        const taxCalculation = this.calculateProgressiveTax(taxableIncome);
        
        // Step 5: Return comprehensive calculation
        return {
            incomeBreakdown: {
                employmentIncome: incomeDetails.employmentIncome || 0,
                businessIncome: incomeDetails.businessIncome || 0,
                otherIncome: incomeDetails.otherIncome || 0,
                investmentIncome: incomeDetails.investmentIncome || 0,
                totalIncome: totalIncome
            },
            deductionBreakdown: totalDeductions,
            taxCalculation: {
                totalIncome: totalIncome,
                totalDeductions: totalDeductions.total,
                personalRelief: this.taxRules.personalRelief,
                taxableIncome: taxableIncome,
                incomeTaxPayable: taxCalculation.totalTax,
                monthlyTax: taxCalculation.totalTax / 12,
                effectiveRate: totalIncome > 0 ? (taxCalculation.totalTax / totalIncome) * 100 : 0,
                marginalRate: taxCalculation.marginalRate,
                netIncome: totalIncome - taxCalculation.totalTax
            },
            taxBreakdown: taxCalculation.breakdown,
            summaryForUser: this.generateSummary(totalIncome, totalDeductions.total, taxCalculation.totalTax)
        };
    }

    calculateTotalIncome(incomeDetails) {
        return (incomeDetails.employmentIncome || 0) +
               (incomeDetails.businessIncome || 0) +
               (incomeDetails.otherIncome || 0) +
               (incomeDetails.investmentIncome || 0);
    }

    calculateTotalDeductions(deductionDetails, totalIncome) {
        const deductions = this.taxRules.deductions;
        let totalDeductions = 0;
        let breakdown = [];

        // EPF Contributions
        if (deductionDetails.epfContributions) {
            const allowable = Math.min(
                deductionDetails.epfContributions,
                deductions.epfContributions.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'EPF Contributions',
                claimed: deductionDetails.epfContributions,
                allowable: allowable,
                description: deductions.epfContributions.description
            });
        }

        // Life Insurance Premiums
        if (deductionDetails.lifeInsurance) {
            const allowable = Math.min(
                deductionDetails.lifeInsurance,
                deductions.lifeInsurance.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'Life Insurance',
                claimed: deductionDetails.lifeInsurance,
                allowable: allowable,
                description: deductions.lifeInsurance.description
            });
        }

        // Charitable Donations
        if (deductionDetails.charitableDonations) {
            const maxAllowable = totalIncome * deductions.charitableDonations.maxPercentage;
            const allowable = Math.min(deductionDetails.charitableDonations, maxAllowable);
            totalDeductions += allowable;
            breakdown.push({
                type: 'Charitable Donations',
                claimed: deductionDetails.charitableDonations,
                allowable: allowable,
                maxAllowable: maxAllowable,
                description: deductions.charitableDonations.description + ` (max 25% of income)`
            });
        }

        // Medical Expenses
        if (deductionDetails.medicalExpenses) {
            const allowable = Math.min(
                deductionDetails.medicalExpenses,
                deductions.medicalExpenses.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'Medical Expenses',
                claimed: deductionDetails.medicalExpenses,
                allowable: allowable,
                description: deductions.medicalExpenses.description
            });
        }

        // Education Expenses
        if (deductionDetails.educationExpenses) {
            const allowable = Math.min(
                deductionDetails.educationExpenses,
                deductions.educationExpenses.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'Education Expenses',
                claimed: deductionDetails.educationExpenses,
                allowable: allowable,
                description: deductions.educationExpenses.description
            });
        }

        // Housing Loan Interest
        if (deductionDetails.housingLoanInterest) {
            const allowable = Math.min(
                deductionDetails.housingLoanInterest,
                deductions.housingLoanInterest.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'Housing Loan Interest',
                claimed: deductionDetails.housingLoanInterest,
                allowable: allowable,
                description: deductions.housingLoanInterest.description
            });
        }

        // Parent Maintenance
        if (deductionDetails.parentMaintenance) {
            const allowable = Math.min(
                deductionDetails.parentMaintenance,
                deductions.parentMaintenance.maxAllowable
            );
            totalDeductions += allowable;
            breakdown.push({
                type: 'Parent Maintenance',
                claimed: deductionDetails.parentMaintenance,
                allowable: allowable,
                description: deductions.parentMaintenance.description
            });
        }

        return {
            total: totalDeductions,
            breakdown: breakdown
        };
    }

    calculateProgressiveTax(taxableIncome) {
        let totalTax = 0;
        let remainingIncome = taxableIncome;
        let breakdown = [];
        let marginalRate = 0;

        for (let bracket of this.taxRules.brackets) {
            if (remainingIncome <= 0) break;

            const bracketSize = bracket.max === Infinity ? remainingIncome : (bracket.max - bracket.min);
            const taxableInBracket = Math.min(remainingIncome, bracketSize);
            const taxInBracket = taxableInBracket * bracket.rate;
            
            if (taxableInBracket > 0) {
                totalTax += taxInBracket;
                marginalRate = bracket.rate * 100; // This will be the highest rate applied
                
                breakdown.push({
                    range: `${this.formatCurrency(bracket.min)} - ${bracket.max === Infinity ? 'Above' : this.formatCurrency(bracket.max)}`,
                    rate: `${(bracket.rate * 100).toFixed(1)}%`,
                    taxableAmount: taxableInBracket,
                    taxAmount: taxInBracket
                });
            }

            remainingIncome -= taxableInBracket;
        }

        return {
            totalTax: totalTax,
            breakdown: breakdown,
            marginalRate: marginalRate
        };
    }

    generateSummary(totalIncome, totalDeductions, totalTax) {
        const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
        const netIncome = totalIncome - totalTax;
        const monthlyTax = totalTax / 12;
        const monthlyNet = netIncome / 12;

        return {
            message: `Your annual income tax is ${this.formatCurrency(totalTax)} (${effectiveRate.toFixed(2)}% effective rate)`,
            monthlyTax: `Monthly tax: ${this.formatCurrency(monthlyTax)}`,
            monthlyNet: `Monthly net income: ${this.formatCurrency(monthlyNet)}`,
            savings: totalDeductions > 0 ? `You saved ${this.formatCurrency(totalDeductions * 0.36)} through deductions` : 'No deductions claimed'
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Validation functions
    validateIncomeData(incomeDetails) {
        const errors = [];
        
        if (!incomeDetails || typeof incomeDetails !== 'object') {
            errors.push('Income details must be provided');
            return errors;
        }

        // Check for negative values
        Object.keys(incomeDetails).forEach(key => {
            if (incomeDetails[key] < 0) {
                errors.push(`${key} cannot be negative`);
            }
        });

        return errors;
    }

    validateDeductionData(deductionDetails) {
        const errors = [];
        
        if (!deductionDetails || typeof deductionDetails !== 'object') {
            return errors; // Deductions are optional
        }

        // Check for negative values
        Object.keys(deductionDetails).forEach(key => {
            if (deductionDetails[key] < 0) {
                errors.push(`${key} cannot be negative`);
            }
        });

        return errors;
    }

    // Get tax planning suggestions
    getTaxPlanningAdvice(calculation) {
        const advice = [];
        const { incomeBreakdown, deductionBreakdown, taxCalculation } = calculation;
        
        // EPF contribution advice
        const currentEPF = deductionBreakdown.breakdown.find(d => d.type === 'EPF Contributions')?.allowable || 0;
        const maxEPF = this.taxRules.deductions.epfContributions.maxAllowable;
        if (currentEPF < maxEPF) {
            const additionalEPF = Math.min(maxEPF - currentEPF, incomeBreakdown.employmentIncome * 0.08);
            const taxSaving = additionalEPF * (taxCalculation.marginalRate / 100);
            advice.push({
                type: 'EPF Optimization',
                suggestion: `Increase EPF contributions by ${this.formatCurrency(additionalEPF)} to save ${this.formatCurrency(taxSaving)} in taxes`
            });
        }

        // Life insurance advice
        const currentInsurance = deductionBreakdown.breakdown.find(d => d.type === 'Life Insurance')?.allowable || 0;
        const maxInsurance = this.taxRules.deductions.lifeInsurance.maxAllowable;
        if (currentInsurance < maxInsurance) {
            const additionalInsurance = maxInsurance - currentInsurance;
            const taxSaving = additionalInsurance * (taxCalculation.marginalRate / 100);
            advice.push({
                type: 'Insurance Planning',
                suggestion: `Consider additional life insurance premiums of ${this.formatCurrency(additionalInsurance)} to save ${this.formatCurrency(taxSaving)} in taxes`
            });
        }

        // High tax rate warning
        if (taxCalculation.effectiveRate > 25) {
            advice.push({
                type: 'Tax Planning',
                suggestion: 'Your effective tax rate is high. Consider consulting a tax advisor for advanced planning strategies'
            });
        }

        return advice;
    }
}

// Global instance
const comprehensiveCalculator = new ComprehensiveIncomeTaxCalculator();

// Function to update the tax calculator interface
function updateComprehensiveTaxCalculator() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Personal Income Tax Calculator</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: #6b7280; margin-bottom: 2rem;">Calculate your Sri Lankan personal income tax for 2024/2025</p>
                
                <!-- Income Details -->
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #1f2937; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Income Details</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                        <div class="form-group">
                            <label>Annual Employment Income (LKR)</label>
                            <input type="number" id="employmentIncome" placeholder="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Business/Professional Income (LKR)</label>
                            <input type="number" id="businessIncome" placeholder="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Other Income (LKR)</label>
                            <input type="number" id="otherIncome" placeholder="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Investment Income (LKR)</label>
                            <input type="number" id="investmentIncome" placeholder="0" min="0">
                        </div>
                    </div>
                </div>
                
                <!-- Deductions & Reliefs -->
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #1f2937; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Deductions & Reliefs</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                        <div class="form-group">
                            <label>EPF Contributions (LKR)</label>
                            <input type="number" id="epfContributions" placeholder="0" min="0">
                            <small style="color: #6b7280;">Max: LKR 1,440,000</small>
                        </div>
                        <div class="form-group">
                            <label>Life Insurance Premiums (LKR)</label>
                            <input type="number" id="lifeInsurance" placeholder="0" min="0">
                            <small style="color: #6b7280;">Max: LKR 100,000</small>
                        </div>
                        <div class="form-group">
                            <label>Donations to Approved Charities (LKR)</label>
                            <input type="number" id="charitableDonations" placeholder="0" min="0">
                            <small style="color: #6b7280;">Max: 25% of income</small>
                        </div>
                        <div class="form-group">
                            <label>Medical Expenses (LKR)</label>
                            <input type="number" id="medicalExpenses" placeholder="0" min="0">
                            <small style="color: #6b7280;">Max: LKR 100,000</small>
                        </div>
                    </div>
                </div>
                
                <!-- Tax Calculation Results -->
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #1f2937; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Tax Calculation</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                            <div style="font-size: 0.9rem; color: #6b7280;">Total Income:</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: #1f2937;" id="displayTotalIncome">LKR 0</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                            <div style="font-size: 0.9rem; color: #6b7280;">Total Deductions:</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: #059669;" id="displayTotalDeductions">LKR 0</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                            <div style="font-size: 0.9rem; color: #6b7280;">Taxable Income:</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: #7c2d12;" id="displayTaxableIncome">LKR 0</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px;">
                            <div style="font-size: 0.9rem; color: #92400e;">Income Tax Payable:</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: #92400e;" id="displayIncomeTax">LKR 0</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                            <div style="font-size: 0.9rem; color: #6b7280;">Monthly Tax:</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: #1f2937;" id="displayMonthlyTax">LKR 0</div>
                        </div>
                    </div>
                    
                    <button onclick="calculateComprehensiveIncomeTax()" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
                        <i class="fas fa-calculator"></i> Calculate Income Tax
                    </button>
                </div>
                
                <!-- Detailed Results -->
                <div id="comprehensiveResults" style="display: none; margin-top: 2rem;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add real-time calculation on input change
    modal.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateComprehensiveIncomeTax);
    });
}

function calculateComprehensiveIncomeTax() {
    try {
        // Get income details
        const incomeDetails = {
            employmentIncome: parseFloat(document.getElementById('employmentIncome')?.value) || 0,
            businessIncome: parseFloat(document.getElementById('businessIncome')?.value) || 0,
            otherIncome: parseFloat(document.getElementById('otherIncome')?.value) || 0,
            investmentIncome: parseFloat(document.getElementById('investmentIncome')?.value) || 0
        };
        
        // Get deduction details
        const deductionDetails = {
            epfContributions: parseFloat(document.getElementById('epfContributions')?.value) || 0,
            lifeInsurance: parseFloat(document.getElementById('lifeInsurance')?.value) || 0,
            charitableDonations: parseFloat(document.getElementById('charitableDonations')?.value) || 0,
            medicalExpenses: parseFloat(document.getElementById('medicalExpenses')?.value) || 0
        };
        
        // Calculate tax
        const calculation = comprehensiveCalculator.calculateComprehensiveIncomeTax(incomeDetails, deductionDetails);
        
        // Update display
        document.getElementById('displayTotalIncome').textContent = comprehensiveCalculator.formatCurrency(calculation.incomeBreakdown.totalIncome);
        document.getElementById('displayTotalDeductions').textContent = comprehensiveCalculator.formatCurrency(calculation.deductionBreakdown.total);
        document.getElementById('displayTaxableIncome').textContent = comprehensiveCalculator.formatCurrency(calculation.taxCalculation.taxableIncome);
        document.getElementById('displayIncomeTax').textContent = comprehensiveCalculator.formatCurrency(calculation.taxCalculation.incomeTaxPayable);
        document.getElementById('displayMonthlyTax').textContent = comprehensiveCalculator.formatCurrency(calculation.taxCalculation.monthlyTax);
        
        // Show detailed results
        showDetailedResults(calculation);
        
    } catch (error) {
        console.error('Error calculating tax:', error);
        alert('Error calculating tax. Please check your inputs.');
    }
}

function showDetailedResults(calculation) {
    const resultsContainer = document.getElementById('comprehensiveResults');
    if (!resultsContainer) return;
    
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
        <div style="background: #f8fafc; border-radius: 12px; padding: 2rem;">
            <h4 style="color: #1f2937; margin-bottom: 1.5rem;">Detailed Tax Calculation Results</h4>
            
            <!-- Tax Breakdown -->
            <div style="margin-bottom: 2rem;">
                <h5 style="color: #374151; margin-bottom: 1rem;">Tax Breakdown by Brackets:</h5>
                ${calculation.taxBreakdown.map(bracket => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                        <span>${bracket.range} (${bracket.rate})</span>
                        <span>${comprehensiveCalculator.formatCurrency(bracket.taxAmount)}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Deduction Breakdown -->
            ${calculation.deductionBreakdown.breakdown.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: #374151; margin-bottom: 1rem;">Deductions Applied:</h5>
                    ${calculation.deductionBreakdown.breakdown.map(deduction => `
                        <div style="margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid #059669;">
                            <div style="font-weight: 600; color: #374151;">${deduction.type}</div>
                            <div style="font-size: 0.9rem; color: #6b7280;">Claimed: ${comprehensiveCalculator.formatCurrency(deduction.claimed)} | Allowed: ${comprehensiveCalculator.formatCurrency(deduction.allowable)}</div>
                            <div style="font-size: 0.8rem; color: #6b7280;">${deduction.description}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Summary -->
            <div style="background: #fff; border-radius: 8px; padding: 1.5rem; border: 2px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; text-align: center;">
                    <div>
                        <div style="font-size: 0.9rem; color: #6b7280;">Effective Tax Rate</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #dc2626;">${calculation.taxCalculation.effectiveRate.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div style="font-size: 0.9rem; color: #6b7280;">Annual Net Income</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">${comprehensiveCalculator.formatCurrency(calculation.taxCalculation.netIncome)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.9rem; color: #6b7280;">Monthly Net Income</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">${comprehensiveCalculator.formatCurrency(calculation.taxCalculation.netIncome / 12)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Tax Planning Advice -->
            <div style="margin-top: 2rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h5 style="color: #92400e; margin-bottom: 0.5rem;">💡 Tax Planning Tips</h5>
                <ul style="color: #92400e; margin: 0; padding-left: 1.5rem;">
                    <li>Personal relief of LKR 3,000,000 automatically applied</li>
                    <li>Consider maximizing EPF contributions (8% of salary)</li>
                    <li>Life insurance premiums up to LKR 100,000 are deductible</li>
                    <li>Keep receipts for medical expenses and charitable donations</li>
                </ul>
            </div>
        </div>
    `;
}

// Override the original tax calculator function
function openTaxCalculator() {
    updateComprehensiveTaxCalculator();
}