/**
 * Test Tax Calculations for MyTracksy
 * Verify all calculations work correctly
 */

function testTaxCalculations() {
    console.log('Testing Tax Calculations...');
    
    // Test Case 1: Income below personal relief
    const testCase1 = {
        employmentIncome: 2500000, // 2.5M
        businessIncome: 0,
        otherIncome: 0,
        investmentIncome: 0
    };
    
    const deductions1 = {
        epfContributions: 200000,
        lifeInsurance: 50000,
        charitableDonations: 0,
        medicalExpenses: 30000
    };
    
    const result1 = comprehensiveCalculator.calculateComprehensiveIncomeTax(testCase1, deductions1);
    console.log('Test Case 1 (Income 2.5M):', result1);
    
    // Test Case 2: Higher income - your example
    const testCase2 = {
        employmentIncome: 1200000,
        businessIncome: 500000,
        otherIncome: 100000,
        investmentIncome: 75000
    };
    
    const deductions2 = {
        epfContributions: 120000,
        lifeInsurance: 50000,
        charitableDonations: 25000,
        medicalExpenses: 30000
    };
    
    const result2 = comprehensiveCalculator.calculateComprehensiveIncomeTax(testCase2, deductions2);
    console.log('Test Case 2 (Your Example):', result2);
    
    // Expected Results for Test Case 2:
    // Total Income: 1,875,000
    // Total Deductions: 225,000
    // Income after deductions: 1,650,000
    // Taxable Income (after 3M relief): 0 (since 1,650,000 < 3,000,000)
    // Tax: 0
    
    console.log('Expected for Test Case 2:');
    console.log('- Total Income: LKR 1,875,000');
    console.log('- Total Deductions: LKR 225,000');
    console.log('- After Deductions: LKR 1,650,000');
    console.log('- Taxable Income: LKR 0 (below 3M relief)');
    console.log('- Tax Payable: LKR 0');
    
    // Test Case 3: High income scenario
    const testCase3 = {
        employmentIncome: 6000000, // 6M
        businessIncome: 2000000,   // 2M
        otherIncome: 500000,       // 500K
        investmentIncome: 300000   // 300K
    };
    
    const deductions3 = {
        epfContributions: 480000,  // 8% of 6M
        lifeInsurance: 100000,
        charitableDonations: 200000,
        medicalExpenses: 100000
    };
    
    const result3 = comprehensiveCalculator.calculateComprehensiveIncomeTax(testCase3, deductions3);
    console.log('Test Case 3 (High Income 8.8M):', result3);
    
    // Expected Results for Test Case 3:
    // Total Income: 8,800,000
    // Total Deductions: 880,000 (but charitable donations limited to 25% of income = 2,200,000, so actual 880,000)
    // Income after deductions: 7,920,000
    // Taxable Income (after 3M relief): 4,920,000
    // Tax calculation:
    // - First 500K at 6% = 30,000
    // - Next 500K at 12% = 60,000
    // - Next 500K at 18% = 90,000
    // - Next 500K at 24% = 120,000
    // - Next 500K at 30% = 150,000
    // - Remaining 2,420K at 36% = 871,200
    // Total Tax = 1,321,200
    
    return {
        testCase1: result1,
        testCase2: result2,
        testCase3: result3
    };
}

// Run tests when this script loads
if (typeof comprehensiveCalculator !== 'undefined') {
    // Wait a bit for everything to load, then run tests
    setTimeout(() => {
        const testResults = testTaxCalculations();
        window.taxTestResults = testResults;
        console.log('All test results stored in window.taxTestResults');
    }, 1000);
}