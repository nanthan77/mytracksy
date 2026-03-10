import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCategories?: string[];
  includeCompanies?: string[];
  includeCultural?: boolean;
  groupBy?: 'date' | 'category' | 'company' | 'month';
  currency?: 'LKR' | 'USD' | 'EUR';
  language?: 'en' | 'si' | 'ta';
  template?: 'detailed' | 'summary' | 'tax' | 'business';
}

export interface TaxReportData {
  personalExpenses: number;
  businessExpenses: number;
  deductibleExpenses: number;
  taxableAmount: number;
  categories: Record<string, number>;
  monthlyBreakdown: Array<{ month: string; amount: number; deductible: number }>;
  culturalDonations: number;
  religiousDonations: number;
}

export interface EmailSchedule {
  id: string;
  recipientEmail: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv';
  template: 'detailed' | 'summary' | 'tax' | 'business';
  filters: Partial<ExportOptions>;
  nextRunDate: Date;
  isActive: boolean;
  lastRunDate?: Date;
}

export class ExportService {
  private static instance: ExportService;
  private emailSchedules: Map<string, EmailSchedule> = new Map();

  // Sri Lankan tax categories and rates
  private taxCategories = {
    deductible: [
      'Medical Expenses',
      'Education',
      'Insurance Premiums',
      'Religious Donations',
      'Charitable Donations',
      'Professional Development'
    ],
    businessDeductible: [
      'Office Supplies',
      'Equipment',
      'Software',
      'Professional Services',
      'Marketing & Advertising',
      'Travel & Accommodation',
      'Training & Development',
      'Legal & Compliance'
    ],
    culturalExemptions: [
      'Temple Donations',
      'Poya Day Expenses',
      'Religious Items',
      'Festival Donations'
    ]
  };

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  constructor() {
    this.loadEmailSchedules();
  }

  /**
   * Export expenses to PDF with Sri Lankan formatting
   */
  public async exportToPDF(expenses: any[], options: ExportOptions): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Set up Sri Lankan formatting
    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;
    const dateFormat = 'dd/MM/yyyy'; // Sri Lankan date format

    // Header
    this.addPDFHeader(doc, options);

    // Summary section
    const summary = this.calculateSummary(expenses, options);
    this.addPDFSummary(doc, summary, currencySymbol);

    // Expense table
    this.addPDFExpenseTable(doc, expenses, options, currencySymbol, dateFormat);

    // Cultural insights (if requested)
    if (options.includeCultural) {
      this.addPDFCulturalSection(doc, expenses, currencySymbol);
    }

    // Footer with Sri Lankan branding
    this.addPDFFooter(doc, options);

    return doc.output('blob');
  }

  /**
   * Export expenses to Excel with multiple sheets
   */
  public async exportToExcel(expenses: any[], options: ExportOptions): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Main expenses sheet
    const expensesData = this.formatExpensesForExcel(expenses, options);
    const expensesWS = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWS, 'Expenses');

    // Summary sheet
    const summaryData = this.createSummarySheet(expenses, options);
    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    // Category breakdown sheet
    const categoryData = this.createCategoryBreakdownSheet(expenses, options);
    const categoryWS = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categoryWS, 'Categories');

    // Monthly trends sheet
    const monthlyData = this.createMonthlyTrendsSheet(expenses, options);
    const monthlyWS = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlyWS, 'Monthly Trends');

    // Cultural events sheet (if requested)
    if (options.includeCultural) {
      const culturalData = this.createCulturalEventsSheet(expenses, options);
      const culturalWS = XLSX.utils.json_to_sheet(culturalData);
      XLSX.utils.book_append_sheet(workbook, culturalWS, 'Cultural Events');
    }

    // Tax report sheet
    if (options.template === 'tax') {
      const taxData = this.createTaxReportSheet(expenses, options);
      const taxWS = XLSX.utils.json_to_sheet(taxData);
      XLSX.utils.book_append_sheet(workbook, taxWS, 'Tax Report');
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Export expenses to CSV
   */
  public async exportToCSV(expenses: any[], options: ExportOptions): Promise<Blob> {
    const csvData = this.formatExpensesForCSV(expenses, options);
    const csvContent = this.arrayToCSV(csvData);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate tax report specifically for Sri Lankan tax system
   */
  public generateTaxReport(expenses: any[], year: number): TaxReportData {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    const yearExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= yearStart && expenseDate <= yearEnd;
    });

    const personalExpenses = yearExpenses
      .filter(e => !e.companyId)
      .reduce((sum, e) => sum + e.amount, 0);

    const businessExpenses = yearExpenses
      .filter(e => e.companyId)
      .reduce((sum, e) => sum + e.amount, 0);

    const deductibleExpenses = yearExpenses
      .filter(e => this.isDeductibleExpense(e))
      .reduce((sum, e) => sum + e.amount, 0);

    const culturalDonations = yearExpenses
      .filter(e => this.taxCategories.culturalExemptions.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);

    const religiousDonations = yearExpenses
      .filter(e => e.category === 'Religious Donations' || e.category === 'Temple Donations')
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate taxable amount (simplified)
    const taxableAmount = Math.max(0, personalExpenses - deductibleExpenses - culturalDonations);

    // Category breakdown
    const categories: Record<string, number> = {};
    yearExpenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    // Monthly breakdown
    const monthlyBreakdown = this.calculateMonthlyTaxBreakdown(yearExpenses);

    return {
      personalExpenses,
      businessExpenses,
      deductibleExpenses,
      taxableAmount,
      categories,
      monthlyBreakdown,
      culturalDonations,
      religiousDonations
    };
  }

  /**
   * Schedule email reports
   */
  public async scheduleEmailReport(schedule: Omit<EmailSchedule, 'id' | 'nextRunDate'>): Promise<string> {
    const id = this.generateScheduleId();
    const nextRunDate = this.calculateNextRunDate(schedule.frequency);
    
    const fullSchedule: EmailSchedule = {
      ...schedule,
      id,
      nextRunDate,
      isActive: true
    };

    this.emailSchedules.set(id, fullSchedule);
    this.saveEmailSchedules();

    // In a real implementation, this would set up a server-side cron job
    console.log(`Email report scheduled: ${id} for ${schedule.recipientEmail}`);
    
    return id;
  }

  /**
   * Get all email schedules
   */
  public getEmailSchedules(): EmailSchedule[] {
    return Array.from(this.emailSchedules.values());
  }

  /**
   * Cancel email schedule
   */
  public cancelEmailSchedule(scheduleId: string): boolean {
    const deleted = this.emailSchedules.delete(scheduleId);
    if (deleted) {
      this.saveEmailSchedules();
    }
    return deleted;
  }

  /**
   * Process due email reports (would be called by server cron job)
   */
  public async processDueEmailReports(expenses: any[]): Promise<void> {
    const now = new Date();
    const dueSchedules = Array.from(this.emailSchedules.values())
      .filter(schedule => schedule.isActive && schedule.nextRunDate <= now);

    for (const schedule of dueSchedules) {
      try {
        await this.sendScheduledEmail(schedule, expenses);
        
        // Update next run date
        schedule.lastRunDate = now;
        schedule.nextRunDate = this.calculateNextRunDate(schedule.frequency, now);
        this.emailSchedules.set(schedule.id, schedule);
        
      } catch (error) {
        console.error(`Failed to send scheduled email ${schedule.id}:`, error);
      }
    }

    this.saveEmailSchedules();
  }

  // Private helper methods

  private addPDFHeader(doc: jsPDF, options: ExportOptions): void {
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Tracksy Expense Report', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const dateRange = `${format(options.dateRange.startDate, 'dd/MM/yyyy')} - ${format(options.dateRange.endDate, 'dd/MM/yyyy')}`;
    doc.text(dateRange, pageWidth / 2, 30, { align: 'center' });
    
    // Sri Lankan flag emoji and branding
    doc.setFontSize(10);
    doc.text('🇱🇰 Sri Lanka\'s Premier Voice Finance App', pageWidth / 2, 40, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);
  }

  private addPDFSummary(doc: jsPDF, summary: any, currencySymbol: string): void {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Expenses: ${currencySymbol} ${summary.totalAmount.toLocaleString()}`, 20, 75);
    doc.text(`Total Transactions: ${summary.totalTransactions}`, 20, 85);
    doc.text(`Average per Transaction: ${currencySymbol} ${summary.averageAmount.toLocaleString()}`, 20, 95);
    
    if (summary.culturalExpenses > 0) {
      doc.text(`Cultural/Religious Expenses: ${currencySymbol} ${summary.culturalExpenses.toLocaleString()}`, 20, 105);
    }
  }

  private addPDFExpenseTable(doc: jsPDF, expenses: any[], options: ExportOptions, currencySymbol: string, dateFormat: string): void {
    const tableData = expenses.map(expense => [
      format(new Date(expense.date), dateFormat),
      expense.description || expense.category,
      expense.category,
      expense.merchant || '-',
      `${currencySymbol} ${expense.amount.toLocaleString()}`,
      expense.paymentMethod || 'Cash'
    ]);

    (doc as any).autoTable({
      startY: 120,
      head: [['Date', 'Description', 'Category', 'Merchant', 'Amount', 'Payment Method']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  }

  private addPDFCulturalSection(doc: jsPDF, expenses: any[], currencySymbol: string): void {
    const culturalExpenses = expenses.filter(e => 
      this.taxCategories.culturalExemptions.includes(e.category) ||
      e.tags?.includes('cultural') ||
      e.tags?.includes('religious')
    );

    if (culturalExpenses.length === 0) return;

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cultural & Religious Expenses', 20, finalY);
    
    const culturalData = culturalExpenses.map(expense => [
      format(new Date(expense.date), 'dd/MM/yyyy'),
      expense.description,
      expense.category,
      `${currencySymbol} ${expense.amount.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: finalY + 10,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: culturalData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    });
  }

  private addPDFFooter(doc: jsPDF, options: ExportOptions): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by Tracksy Sri Lanka on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, pageHeight - 20);
    doc.text('tracksy.lk | Voice-Enabled Finance Tracking', pageWidth - 20, pageHeight - 20, { align: 'right' });
  }

  private formatExpensesForExcel(expenses: any[], options: ExportOptions): any[] {
    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;
    
    return expenses.map(expense => ({
      Date: format(new Date(expense.date), 'dd/MM/yyyy'),
      Description: expense.description || expense.category,
      Category: expense.category,
      Merchant: expense.merchant || '',
      Amount: expense.amount,
      'Amount (Formatted)': `${currencySymbol} ${expense.amount.toLocaleString()}`,
      'Payment Method': expense.paymentMethod || 'Cash',
      Tags: expense.tags?.join(', ') || '',
      'Cultural Context': expense.culturalContext || '',
      'Company': expense.companyId ? 'Business' : 'Personal',
      'Source': expense.metadata?.source || 'Manual',
      'Confidence': expense.metadata?.confidence || 1.0
    }));
  }

  private formatExpensesForCSV(expenses: any[], options: ExportOptions): any[] {
    return this.formatExpensesForExcel(expenses, options);
  }

  private createSummarySheet(expenses: any[], options: ExportOptions): any[] {
    const summary = this.calculateSummary(expenses, options);
    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;
    
    return [
      { Metric: 'Total Expenses', Value: `${currencySymbol} ${summary.totalAmount.toLocaleString()}` },
      { Metric: 'Total Transactions', Value: summary.totalTransactions },
      { Metric: 'Average per Transaction', Value: `${currencySymbol} ${summary.averageAmount.toLocaleString()}` },
      { Metric: 'Date Range', Value: `${format(options.dateRange.startDate, 'dd/MM/yyyy')} - ${format(options.dateRange.endDate, 'dd/MM/yyyy')}` },
      { Metric: 'Cultural Expenses', Value: `${currencySymbol} ${summary.culturalExpenses.toLocaleString()}` },
      { Metric: 'Business Expenses', Value: `${currencySymbol} ${summary.businessExpenses.toLocaleString()}` },
      { Metric: 'Personal Expenses', Value: `${currencySymbol} ${summary.personalExpenses.toLocaleString()}` }
    ];
  }

  private createCategoryBreakdownSheet(expenses: any[], options: ExportOptions): any[] {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        Category: category,
        Amount: `${currencySymbol} ${amount.toLocaleString()}`,
        Percentage: `${((amount / totalAmount) * 100).toFixed(1)}%`,
        'Raw Amount': amount
      }));
  }

  private createMonthlyTrendsSheet(expenses: any[], options: ExportOptions): any[] {
    const monthlyTotals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const monthKey = format(new Date(expense.date), 'yyyy-MM');
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });

    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;
    
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        Month: format(new Date(month + '-01'), 'MMMM yyyy'),
        Amount: `${currencySymbol} ${amount.toLocaleString()}`,
        'Raw Amount': amount
      }));
  }

  private createCulturalEventsSheet(expenses: any[], options: ExportOptions): any[] {
    const culturalExpenses = expenses.filter(e => 
      this.taxCategories.culturalExemptions.includes(e.category) ||
      e.tags?.includes('cultural') ||
      e.tags?.includes('religious')
    );

    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;

    return culturalExpenses.map(expense => ({
      Date: format(new Date(expense.date), 'dd/MM/yyyy'),
      Event: expense.culturalContext || 'General Cultural',
      Category: expense.category,
      Description: expense.description,
      Amount: `${currencySymbol} ${expense.amount.toLocaleString()}`,
      'Tax Deductible': this.taxCategories.culturalExemptions.includes(expense.category) ? 'Yes' : 'No'
    }));
  }

  private createTaxReportSheet(expenses: any[], options: ExportOptions): any[] {
    const year = options.dateRange.startDate.getFullYear();
    const taxReport = this.generateTaxReport(expenses, year);
    const currencySymbol = options.currency === 'LKR' ? 'Rs.' : options.currency;

    return [
      { Item: 'Personal Expenses', Amount: `${currencySymbol} ${taxReport.personalExpenses.toLocaleString()}` },
      { Item: 'Business Expenses', Amount: `${currencySymbol} ${taxReport.businessExpenses.toLocaleString()}` },
      { Item: 'Deductible Expenses', Amount: `${currencySymbol} ${taxReport.deductibleExpenses.toLocaleString()}` },
      { Item: 'Cultural/Religious Donations', Amount: `${currencySymbol} ${taxReport.culturalDonations.toLocaleString()}` },
      { Item: 'Taxable Amount', Amount: `${currencySymbol} ${taxReport.taxableAmount.toLocaleString()}` },
      { Item: '', Amount: '' }, // Empty row
      { Item: 'Monthly Breakdown:', Amount: '' },
      ...taxReport.monthlyBreakdown.map(month => ({
        Item: `  ${month.month}`,
        Amount: `${currencySymbol} ${month.amount.toLocaleString()} (Deductible: ${currencySymbol} ${month.deductible.toLocaleString()})`
      }))
    ];
  }

  private calculateSummary(expenses: any[], options: ExportOptions): any {
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransactions = expenses.length;
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    const culturalExpenses = expenses
      .filter(e => this.taxCategories.culturalExemptions.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const businessExpenses = expenses
      .filter(e => e.companyId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const personalExpenses = totalAmount - businessExpenses;

    return {
      totalAmount,
      totalTransactions,
      averageAmount,
      culturalExpenses,
      businessExpenses,
      personalExpenses
    };
  }

  private calculateMonthlyTaxBreakdown(expenses: any[]): Array<{ month: string; amount: number; deductible: number }> {
    const monthly: Record<string, { amount: number; deductible: number }> = {};

    expenses.forEach(expense => {
      const monthKey = format(new Date(expense.date), 'MMMM yyyy');
      if (!monthly[monthKey]) {
        monthly[monthKey] = { amount: 0, deductible: 0 };
      }
      
      monthly[monthKey].amount += expense.amount;
      if (this.isDeductibleExpense(expense)) {
        monthly[monthKey].deductible += expense.amount;
      }
    });

    return Object.entries(monthly).map(([month, data]) => ({
      month,
      amount: data.amount,
      deductible: data.deductible
    }));
  }

  private isDeductibleExpense(expense: any): boolean {
    return this.taxCategories.deductible.includes(expense.category) ||
           this.taxCategories.businessDeductible.includes(expense.category) ||
           this.taxCategories.culturalExemptions.includes(expense.category);
  }

  private arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private async sendScheduledEmail(schedule: EmailSchedule, expenses: any[]): Promise<void> {
    // Filter expenses based on schedule filters
    const filteredExpenses = this.filterExpensesForSchedule(expenses, schedule);
    
    // Generate report based on format
    let reportBlob: Blob;
    const exportOptions: ExportOptions = {
      format: schedule.format,
      dateRange: this.getDateRangeForFrequency(schedule.frequency),
      template: schedule.template,
      ...schedule.filters
    };

    switch (schedule.format) {
      case 'pdf':
        reportBlob = await this.exportToPDF(filteredExpenses, exportOptions);
        break;
      case 'excel':
        reportBlob = await this.exportToExcel(filteredExpenses, exportOptions);
        break;
      case 'csv':
        reportBlob = await this.exportToCSV(filteredExpenses, exportOptions);
        break;
      default:
        throw new Error(`Unsupported format: ${schedule.format}`);
    }

    // In a real implementation, this would send the email via a service like SendGrid
    console.log(`Sending ${schedule.format} report to ${schedule.recipientEmail}`);
    console.log(`Report size: ${reportBlob.size} bytes`);
  }

  private filterExpensesForSchedule(expenses: any[], schedule: EmailSchedule): any[] {
    const dateRange = this.getDateRangeForFrequency(schedule.frequency);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
    });
  }

  private getDateRangeForFrequency(frequency: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (frequency) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  }

  private calculateNextRunDate(frequency: string, fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
    }

    return nextDate;
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveEmailSchedules(): void {
    try {
      const schedules = Array.from(this.emailSchedules.values());
      localStorage.setItem('tracksy-email-schedules', JSON.stringify(schedules));
    } catch (error) {
      console.error('Failed to save email schedules:', error);
    }
  }

  private loadEmailSchedules(): void {
    try {
      const stored = localStorage.getItem('tracksy-email-schedules');
      if (stored) {
        const schedules = JSON.parse(stored);
        schedules.forEach((schedule: EmailSchedule) => {
          schedule.nextRunDate = new Date(schedule.nextRunDate);
          if (schedule.lastRunDate) {
            schedule.lastRunDate = new Date(schedule.lastRunDate);
          }
          this.emailSchedules.set(schedule.id, schedule);
        });
      }
    } catch (error) {
      console.error('Failed to load email schedules:', error);
    }
  }
}

export const exportService = ExportService.getInstance();