/**
 * Sri Lankan Tax Compliance Engine for MyTracksy
 * 
 * Comprehensive implementation of Sri Lankan tax system including:
 * - VAT (18% current rate)
 * - Progressive Income Tax (2025 rates)
 * - Withholding Tax (WHT) with multiple rates
 * - EPF/ETF calculations and compliance
 * - Service Export Tax (15%)
 * - Foreign Income Tax (15%)
 * 
 * Last Updated: 2025 - Based on latest tax reforms
 */

class SriLankanTaxEngine {
    constructor() {
        this.initializeTaxRates();
        this.initializeEPFETFRules();
        this.initializeComplianceCalendar();
    }

    initializeTaxRates() {
        this.taxRates = {
            // VAT Rates (increased from 15% to 18% in January 2024)
            vat: {
                standard: 0.18, // Current 18% rate (increased from 15% end-2023)
                registrationThreshold: 12000000, // LKR 12 million annual turnover
                quarterlyThreshold: 3000000, // LKR 3 million per quarter
                digitalServices: 0.18, // B2C digital services
                filingFrequency: 'monthly',
                returnDeadline: 'last day of following month', // VAT returns due last day
                paymentDeadline: 20, // Payments due 20th of following month
                zeroRated: ['exports'], // Zero-rated supplies
                exempt: [] // Exempt supplies per law
            },

            // Progressive Income Tax Structure (2025) - Updated per latest rules
            incomeTax: {
                personalRelief: 3000000, // LKR 3 million personal relief (updated from 1.8M)
                brackets: [
                    { min: 0, max: 500000, rate: 0.06 },           // 6% on first LKR 500K
                    { min: 500000, max: 1000000, rate: 0.12 },     // 12% on next LKR 500K  
                    { min: 1000000, max: 1500000, rate: 0.18 },    // 18% on next LKR 500K
                    { min: 1500000, max: 2000000, rate: 0.24 },    // 24% on next LKR 500K
                    { min: 2000000, max: 2500000, rate: 0.30 },    // 30% on next LKR 500K
                    { min: 2500000, max: Infinity, rate: 0.36 }    // 36% on balance above LKR 2.5M
                ],
                fiscalYear: { start: 'April 1', end: 'March 31' },
                installmentDates: ['Aug 15', 'Nov 15', 'Feb 15', 'May 15']
            },

            // Corporate Income Tax  
            corporateTax: {
                standard: 0.30,                    // 30% standard rate
                specialSectors: 0.40,              // 40% for betting/gambling, liquor, tobacco
                investmentAssetGains: 0.30,        // 30% on gains from investment assets
                remittanceTax: 0.14,               // 14% remittance tax for non-residents
                filingDeadline: 'November 30',
                installmentDates: ['Aug 15', 'Nov 15', 'Feb 15', 'May 15']
            },

            // Withholding Tax Rates (increased from 5% to 10% in December 2024)
            wht: {
                interestIncome: { rate: 0.10, threshold: 0 },                    // 10%, no minimum
                serviceFees: { rate: 0.05, threshold: 150000 },                 // 5%, >LKR 150,000/month
                rent: { rate: 0.10, threshold: 150000 },                        // 10%, >LKR 150,000/month
                dividends: { rate: 0.10, threshold: 0 },                        // 10%, no minimum
                serviceFeesNonResident: { rate: 0.14, threshold: 0 },           // 14%, no minimum
                royalties: { rate: 0.14, threshold: 0 }                         // 14%, no minimum
            },

            // Service Export Tax (New in 2025)
            serviceExportTax: {
                rate: 0.15,                        // 15% maximum for individuals
                threshold: 150000,                 // Above LKR 150,000 monthly income
                effectiveDate: '2025-04-01',
                scope: 'Services rendered in Sri Lanka for use outside Sri Lanka'
            },

            // Foreign Income Tax (New in 2025)
            foreignIncomeTax: {
                rate: 0.15,                        // 15% on foreign-sourced income
                scope: 'Foreign income remitted to Sri Lanka through banking channels'
            }
        };
    }

    initializeEPFETFRules() {
        this.epfEtfRules = {
            // Employee Provident Fund (EPF Act No. 15 of 1958)
            epf: {
                employeeContribution: 0.08,        // 8% of total monthly earnings
                employerContribution: 0.12,        // 12% of total monthly earnings
                totalContribution: 0.20,           // 20% of employee's total monthly earnings
                mandatoryAge: 14,                  // All employees above 14 years
                registrationDeadline: 14,          // 14 days from hiring
                paymentDeadline: 'last working day of following month' // Updated per regulations
            },

            // Employee Trust Fund (ETF Act No. 46 of 1980)
            etf: {
                employerContribution: 0.03,        // 3% of total monthly earnings
                employeeContribution: 0.00,        // No employee deduction permitted
                registrationDeadline: 14,          // 14 days from hiring
                paymentDeadline: 'last working day of following month' // Updated per regulations
            },

            // Earnings Components
            includedEarnings: [
                'basic_salary',
                'wages',
                'cost_of_living_allowance',
                'holiday_payments',
                'food_allowances',
                'cash_value_food',
                'commission',
                'piece_rate_payments',
                'contract_payments'
            ],

            excludedEarnings: [
                'overtime_payments',
                'traveling_expenses',
                'incentive_payments',
                'bonus_payments'
            ],

            // Penalty Structure (applies to both EPF and ETF)
            penalties: {
                '1-10_days': 0.05,      // 5% surcharge
                '11-30_days': 0.15,     // 15% surcharge
                '1-3_months': 0.20,     // 20% surcharge
                '3-6_months': 0.30,     // 30% surcharge
                '6-12_months': 0.40,    // 40% surcharge
                'over_12_months': 0.50  // 50% surcharge
            },

            // Electronic Filing Requirements
            electronicFiling: {
                epf: {
                    mandatory: true,
                    threshold: 50,          // 50+ employees
                    effectiveDate: '2012-01-01'
                },
                etf: {
                    mandatory: true,
                    threshold: 15,          // 15+ employees
                    effectiveDate: '2023-02-01'
                }
            }
        };
    }

    initializeComplianceCalendar() {
        this.complianceCalendar = {
            monthly: [
                { task: 'VAT Returns', deadline: 20, description: '20th of following month' },
                { task: 'WHT Payments', deadline: 15, description: '15th of following month' },
                { task: 'EPF/ETF Payments', deadline: 15, description: '15th of following month' }
            ],
            quarterly: [
                { task: 'Quarterly Tax', deadlines: ['Aug 15', 'Nov 15', 'Feb 15', 'May 15'] }
            ],
            annual: [
                { task: 'Income Tax Returns', deadline: 'November 30' },
                { task: 'APIT Returns', deadline: 'April 30' }
            ]
        };
    }

    // VAT Calculations
    calculateVAT(amount, isExempt = false, isZeroRated = false) {
        if (isExempt || isZeroRated) {
            return {
                netAmount: amount,
                vatAmount: 0,
                grossAmount: amount,
                vatRate: 0,
                applicable: false
            };
        }

        const vatRate = this.taxRates.vat.standard;
        const vatAmount = amount * vatRate;
        const grossAmount = amount + vatAmount;

        return {
            netAmount: amount,
            vatAmount: vatAmount,
            grossAmount: grossAmount,
            vatRate: vatRate,
            applicable: true,
            filingDeadline: this.getNextFilingDeadline('vat')
        };
    }

    // Progressive Income Tax Calculation
    calculateIncomeTax(annualIncome) {
        const brackets = this.taxRates.incomeTax.brackets;
        let totalTax = 0;
        let remainingIncome = annualIncome;
        let taxBreakdown = [];

        for (let bracket of brackets) {
            if (remainingIncome <= 0) break;

            const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
            const taxInBracket = taxableInBracket * bracket.rate;
            
            if (taxableInBracket > 0) {
                totalTax += taxInBracket;
                taxBreakdown.push({
                    range: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? 'Above' : bracket.max.toLocaleString()}`,
                    rate: (bracket.rate * 100).toFixed(1) + '%',
                    taxableAmount: taxableInBracket,
                    taxAmount: taxInBracket
                });
            }

            remainingIncome -= taxableInBracket;
        }

        const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

        return {
            annualIncome: annualIncome,
            totalTax: totalTax,
            netIncome: annualIncome - totalTax,
            effectiveRate: effectiveRate.toFixed(2) + '%',
            monthlyTax: totalTax / 12,
            taxBreakdown: taxBreakdown,
            filingDeadline: this.taxRates.incomeTax.filingDeadline
        };
    }

    // Withholding Tax Calculation
    calculateWHT(amount, paymentType, isResident = true) {
        const whtRules = this.taxRates.wht;
        let whtRule;

        switch (paymentType.toLowerCase()) {
            case 'interest':
            case 'interest_income':
                whtRule = whtRules.interestIncome;
                break;
            case 'service_fees':
                whtRule = isResident ? whtRules.serviceFees : whtRules.serviceFeesNonResident;
                break;
            case 'rent':
                whtRule = whtRules.rent;
                break;
            case 'dividends':
                whtRule = whtRules.dividends;
                break;
            case 'royalties':
                whtRule = whtRules.royalties;
                break;
            default:
                whtRule = { rate: 0, threshold: 0 };
        }

        const isApplicable = amount > whtRule.threshold;
        const whtAmount = isApplicable ? amount * whtRule.rate : 0;

        return {
            grossAmount: amount,
            whtRate: whtRule.rate * 100 + '%',
            whtAmount: whtAmount,
            netAmount: amount - whtAmount,
            threshold: whtRule.threshold,
            applicable: isApplicable,
            paymentType: paymentType,
            isResident: isResident
        };
    }

    // EPF/ETF Calculations
    calculateEPFETF(employee, monthlyEarnings) {
        const epfRules = this.epfEtfRules.epf;
        const etfRules = this.epfEtfRules.etf;

        // Calculate total earnings (include specified components)
        const totalEarnings = this.calculateTotalEarnings(monthlyEarnings);

        // EPF Calculations
        const epfEmployeeContribution = totalEarnings * epfRules.employeeContribution;
        const epfEmployerContribution = totalEarnings * epfRules.employerContribution;
        const epfTotalContribution = epfEmployeeContribution + epfEmployerContribution;

        // ETF Calculations (employer only)
        const etfEmployerContribution = totalEarnings * etfRules.etfContribution;

        // Total employer burden
        const totalEmployerContribution = epfEmployerContribution + etfEmployerContribution;

        // Net salary calculation
        const netSalary = totalEarnings - epfEmployeeContribution;

        return {
            employee: {
                name: employee.name,
                epfNumber: employee.epfNumber,
                nic: employee.nic
            },
            earnings: {
                totalEarnings: totalEarnings,
                netSalary: netSalary
            },
            epf: {
                employeeContribution: epfEmployeeContribution,
                employerContribution: epfEmployerContribution,
                totalContribution: epfTotalContribution,
                rate: epfRules.employeeContribution + epfRules.employerContribution
            },
            etf: {
                employerContribution: etfEmployerContribution,
                rate: etfRules.etfContribution
            },
            totals: {
                employeeDeductions: epfEmployeeContribution,
                employerContributions: totalEmployerContribution,
                grandTotal: epfTotalContribution + etfEmployerContribution
            },
            compliance: {
                paymentDeadline: this.getNextPaymentDeadline('epf_etf'),
                filingRequired: this.isElectronicFilingRequired(employee.companySize)
            }
        };
    }

    calculateTotalEarnings(monthlyEarnings) {
        const included = this.epfEtfRules.includedEarnings;
        const excluded = this.epfEtfRules.excludedEarnings;
        
        let totalEarnings = 0;

        // Add all included earnings components
        for (let component in monthlyEarnings) {
            if (included.includes(component)) {
                totalEarnings += monthlyEarnings[component] || 0;
            }
        }

        return totalEarnings;
    }

    // Service Export Tax (New 2025)
    calculateServiceExportTax(monthlyIncome, isServiceExport = true) {
        const rules = this.taxRates.serviceExportTax;
        
        if (!isServiceExport || monthlyIncome <= rules.threshold) {
            return {
                monthlyIncome: monthlyIncome,
                taxAmount: 0,
                netIncome: monthlyIncome,
                applicable: false,
                reason: monthlyIncome <= rules.threshold ? 'Below threshold' : 'Not service export'
            };
        }

        const taxAmount = monthlyIncome * rules.rate;
        const netIncome = monthlyIncome - taxAmount;

        return {
            monthlyIncome: monthlyIncome,
            taxAmount: taxAmount,
            netIncome: netIncome,
            taxRate: rules.rate * 100 + '%',
            threshold: rules.threshold,
            applicable: true,
            effectiveDate: rules.effectiveDate,
            scope: rules.scope
        };
    }

    // Foreign Income Tax (New 2025)
    calculateForeignIncomeTax(foreignIncome, isRemittedThroughBank = true) {
        const rules = this.taxRates.foreignIncomeTax;
        
        if (!isRemittedThroughBank || foreignIncome <= 0) {
            return {
                foreignIncome: foreignIncome,
                taxAmount: 0,
                netIncome: foreignIncome,
                applicable: false,
                reason: 'Not remitted through banking channels or no income'
            };
        }

        const taxAmount = foreignIncome * rules.rate;
        const netIncome = foreignIncome - taxAmount;

        return {
            foreignIncome: foreignIncome,
            taxAmount: taxAmount,
            netIncome: netIncome,
            taxRate: rules.rate * 100 + '%',
            applicable: true,
            scope: rules.scope
        };
    }

    // Penalty Calculations
    calculatePenalties(dueAmount, daysLate, taxType = 'epf_etf') {
        const penalties = this.epfEtfRules.penalties;
        let penaltyRate = 0;

        if (daysLate >= 1 && daysLate <= 10) {
            penaltyRate = penalties['1-10_days'];
        } else if (daysLate >= 11 && daysLate <= 30) {
            penaltyRate = penalties['11-30_days'];
        } else if (daysLate >= 31 && daysLate <= 90) {
            penaltyRate = penalties['1-3_months'];
        } else if (daysLate >= 91 && daysLate <= 180) {
            penaltyRate = penalties['3-6_months'];
        } else if (daysLate >= 181 && daysLate <= 365) {
            penaltyRate = penalties['6-12_months'];
        } else if (daysLate > 365) {
            penaltyRate = penalties['over_12_months'];
        }

        const penaltyAmount = dueAmount * penaltyRate;
        const totalAmount = dueAmount + penaltyAmount;

        return {
            dueAmount: dueAmount,
            daysLate: daysLate,
            penaltyRate: penaltyRate * 100 + '%',
            penaltyAmount: penaltyAmount,
            totalAmount: totalAmount,
            taxType: taxType
        };
    }

    // Compliance Helpers
    getNextFilingDeadline(taxType) {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);
        
        switch (taxType) {
            case 'vat':
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20);
            case 'wht':
            case 'epf_etf':
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15);
            default:
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20);
        }
    }

    getNextPaymentDeadline(taxType) {
        return this.getNextFilingDeadline(taxType);
    }

    isElectronicFilingRequired(companySize) {
        const epfThreshold = this.epfEtfRules.electronicFiling.epf.threshold;
        const etfThreshold = this.epfEtfRules.electronicFiling.etf.threshold;
        
        return {
            epf: companySize >= epfThreshold,
            etf: companySize >= etfThreshold,
            either: companySize >= Math.min(epfThreshold, etfThreshold)
        };
    }

    // Employee Registration Validation
    validateEmployeeRegistration(employee) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        if (!employee.name || employee.name.trim().length === 0) {
            errors.push('Employee name is required');
        }

        if (!employee.nic || !this.validateNIC(employee.nic)) {
            errors.push('Valid National Identity Card number is required');
        }

        if (!employee.dateOfBirth) {
            errors.push('Date of birth is required');
        }

        if (!employee.employmentDate) {
            errors.push('Employment date is required');
        }

        if (!employee.basicSalary || employee.basicSalary <= 0) {
            errors.push('Basic salary must be greater than zero');
        }

        // Check registration deadline (14 days from employment)
        if (employee.employmentDate) {
            const employmentDate = new Date(employee.employmentDate);
            const registrationDeadline = new Date(employmentDate);
            registrationDeadline.setDate(employmentDate.getDate() + 14);
            
            if (new Date() > registrationDeadline) {
                warnings.push(`Registration deadline passed. Should have been registered by ${registrationDeadline.toDateString()}`);
            }
        }

        // Check minimum age (14 years)
        if (employee.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(employee.dateOfBirth);
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 14) {
                errors.push('Employee must be at least 14 years old for EPF/ETF registration');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    validateNIC(nic) {
        // Sri Lankan NIC validation (both old and new formats)
        const oldFormat = /^[0-9]{9}[vVxX]$/;
        const newFormat = /^[0-9]{12}$/;
        
        return oldFormat.test(nic) || newFormat.test(nic);
    }

    // Comprehensive Tax Summary
    generateTaxSummary(employee, monthlyData) {
        const summary = {
            employee: employee,
            period: monthlyData.period,
            calculations: {}
        };

        // EPF/ETF Calculations
        if (monthlyData.earnings) {
            summary.calculations.epfEtf = this.calculateEPFETF(employee, monthlyData.earnings);
        }

        // Income Tax if annual income provided
        if (monthlyData.annualIncome) {
            summary.calculations.incomeTax = this.calculateIncomeTax(monthlyData.annualIncome);
        }

        // VAT on business expenses
        if (monthlyData.businessExpenses) {
            summary.calculations.vat = this.calculateVAT(monthlyData.businessExpenses);
        }

        // WHT if applicable
        if (monthlyData.whtPayments) {
            summary.calculations.wht = [];
            for (let payment of monthlyData.whtPayments) {
                summary.calculations.wht.push(
                    this.calculateWHT(payment.amount, payment.type, payment.isResident)
                );
            }
        }

        // Service Export Tax if applicable
        if (monthlyData.serviceExportIncome) {
            summary.calculations.serviceExportTax = this.calculateServiceExportTax(
                monthlyData.serviceExportIncome, true
            );
        }

        // Foreign Income Tax if applicable
        if (monthlyData.foreignIncome) {
            summary.calculations.foreignIncomeTax = this.calculateForeignIncomeTax(
                monthlyData.foreignIncome, true
            );
        }

        // Calculate total tax burden
        summary.totals = this.calculateTotalTaxBurden(summary.calculations);

        return summary;
    }

    calculateTotalTaxBurden(calculations) {
        let totalEmployeeTax = 0;
        let totalEmployerBurden = 0;
        let totalGovernmentRevenue = 0;

        // EPF/ETF
        if (calculations.epfEtf) {
            totalEmployeeTax += calculations.epfEtf.epf.employeeContribution;
            totalEmployerBurden += calculations.epfEtf.totals.employerContributions;
            totalGovernmentRevenue += calculations.epfEtf.totals.grandTotal;
        }

        // Income Tax
        if (calculations.incomeTax) {
            totalEmployeeTax += calculations.incomeTax.monthlyTax;
            totalGovernmentRevenue += calculations.incomeTax.monthlyTax;
        }

        // VAT
        if (calculations.vat && calculations.vat.applicable) {
            totalGovernmentRevenue += calculations.vat.vatAmount;
        }

        // WHT
        if (calculations.wht) {
            for (let wht of calculations.wht) {
                if (wht.applicable) {
                    totalGovernmentRevenue += wht.whtAmount;
                }
            }
        }

        // Service Export Tax
        if (calculations.serviceExportTax && calculations.serviceExportTax.applicable) {
            totalEmployeeTax += calculations.serviceExportTax.taxAmount;
            totalGovernmentRevenue += calculations.serviceExportTax.taxAmount;
        }

        // Foreign Income Tax
        if (calculations.foreignIncomeTax && calculations.foreignIncomeTax.applicable) {
            totalEmployeeTax += calculations.foreignIncomeTax.taxAmount;
            totalGovernmentRevenue += calculations.foreignIncomeTax.taxAmount;
        }

        return {
            totalEmployeeTax: totalEmployeeTax,
            totalEmployerBurden: totalEmployerBurden,
            totalGovernmentRevenue: totalGovernmentRevenue,
            combinedBurden: totalEmployeeTax + totalEmployerBurden
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SriLankanTaxEngine;
}

// Global initialization for browser use
if (typeof window !== 'undefined') {
    window.SriLankanTaxEngine = SriLankanTaxEngine;
}