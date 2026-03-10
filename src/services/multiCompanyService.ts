export interface Company {
  id: string;
  name: string;
  displayName: string;
  registrationNumber?: string;
  taxId?: string;
  industry: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  currency: 'LKR' | 'USD' | 'EUR' | 'GBP';
  fiscalYearStart: string; // MM-DD format
  isActive: boolean;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  budgetAllocated: number;
  budgetUsed: number;
  manager: string;
  costCenter: string;
  description?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  departments: string[]; // Department IDs
  manager: string;
  client?: string;
}

export interface ExpensePolicy {
  id: string;
  companyId: string;
  name: string;
  description: string;
  rules: {
    category: string;
    dailyLimit?: number;
    monthlyLimit?: number;
    requiresReceipt: boolean;
    requiresApproval: boolean;
    approvalThreshold: number;
    allowedMerchants?: string[];
    restrictedMerchants?: string[];
  }[];
  isActive: boolean;
}

export interface MultiCompanyExpense {
  id: string;
  userId: string;
  companyId: string;
  departmentId?: string;
  projectId?: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'reimbursement';
  receiptUrl?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  tags: string[];
  metadata: {
    source: 'manual' | 'voice' | 'sms' | 'import';
    confidence?: number;
    culturalContext?: any;
    location?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyAnalytics {
  companyId: string;
  period: string;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  expensesByDepartment: Record<string, number>;
  expensesByProject: Record<string, number>;
  averageExpenseAmount: number;
  topMerchants: Array<{ name: string; amount: number; count: number }>;
  complianceScore: number;
  budgetUtilization: number;
  trendAnalysis: {
    growth: number;
    seasonality: Record<string, number>;
    forecast: number;
  };
}

export class MultiCompanyService {
  private static instance: MultiCompanyService;
  private companies: Map<string, Company> = new Map();
  private departments: Map<string, Department> = new Map();
  private projects: Map<string, Project> = new Map();
  private policies: Map<string, ExpensePolicy> = new Map();
  private expenses: Map<string, MultiCompanyExpense> = new Map();
  private currentCompanyId: string | null = null;

  // Sri Lankan industry classifications
  private sriLankanIndustries = [
    'Agriculture', 'Manufacturing', 'Construction', 'Trade', 'Tourism',
    'Information Technology', 'Financial Services', 'Healthcare', 'Education',
    'Transportation', 'Real Estate', 'Professional Services', 'Hospitality',
    'Telecommunications', 'Energy', 'Mining', 'Textiles', 'Food Processing'
  ];

  // Common Sri Lankan business expense categories
  private businessExpenseCategories = [
    'Office Supplies', 'Equipment', 'Software', 'Professional Services',
    'Marketing & Advertising', 'Travel & Accommodation', 'Meals & Entertainment',
    'Training & Development', 'Insurance', 'Utilities', 'Rent & Facilities',
    'Legal & Compliance', 'Bank Charges', 'Telecommunications', 'Fuel & Vehicle',
    'Maintenance & Repairs', 'Taxes & Licenses', 'Employee Benefits'
  ];

  public static getInstance(): MultiCompanyService {
    if (!MultiCompanyService.instance) {
      MultiCompanyService.instance = new MultiCompanyService();
    }
    return MultiCompanyService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultData();
  }

  /**
   * Create a new company
   */
  public async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const company: Company = {
      ...companyData,
      id: this.generateId('company'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.companies.set(company.id, company);
    
    // Create default departments
    await this.createDefaultDepartments(company.id);
    
    // Create default expense policy
    await this.createDefaultExpensePolicy(company.id);
    
    this.saveData();
    return company;
  }

  /**
   * Create a department for a company
   */
  public async createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    const department: Department = {
      ...departmentData,
      id: this.generateId('dept')
    };

    this.departments.set(department.id, department);
    this.saveData();
    return department;
  }

  /**
   * Create a project for a company
   */
  public async createProject(projectData: Omit<Project, 'id' | 'spent'>): Promise<Project> {
    const project: Project = {
      ...projectData,
      id: this.generateId('proj'),
      spent: 0
    };

    this.projects.set(project.id, project);
    this.saveData();
    return project;
  }

  /**
   * Add an expense with company/department/project context
   */
  public async addMultiCompanyExpense(expenseData: Omit<MultiCompanyExpense, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{
    expense: MultiCompanyExpense;
    policyViolations: string[];
    requiresApproval: boolean;
  }> {
    const expense: MultiCompanyExpense = {
      ...expenseData,
      id: this.generateId('expense'),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check against expense policies
    const policyCheck = await this.checkExpensePolicy(expense);
    
    // Set initial status based on policy
    if (policyCheck.requiresApproval) {
      expense.status = 'submitted';
    } else if (policyCheck.policyViolations.length === 0) {
      expense.status = 'approved';
    }

    this.expenses.set(expense.id, expense);
    
    // Update department and project budgets
    await this.updateBudgets(expense);
    
    this.saveData();
    
    return {
      expense,
      policyViolations: policyCheck.policyViolations,
      requiresApproval: policyCheck.requiresApproval
    };
  }

  /**
   * Switch active company context
   */
  public setActiveCompany(companyId: string): void {
    if (this.companies.has(companyId)) {
      this.currentCompanyId = companyId;
      localStorage.setItem('tracksy-active-company', companyId);
    }
  }

  /**
   * Get current active company
   */
  public getCurrentCompany(): Company | null {
    if (this.currentCompanyId) {
      return this.companies.get(this.currentCompanyId) || null;
    }
    return null;
  }

  /**
   * Get all companies for a user
   */
  public getUserCompanies(): Company[] {
    return Array.from(this.companies.values())
      .filter(company => company.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get departments for a company
   */
  public getCompanyDepartments(companyId: string): Department[] {
    return Array.from(this.departments.values())
      .filter(dept => dept.companyId === companyId && dept.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get projects for a company
   */
  public getCompanyProjects(companyId: string): Project[] {
    return Array.from(this.projects.values())
      .filter(project => project.companyId === companyId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  /**
   * Get expenses for a company with filters
   */
  public getCompanyExpenses(companyId: string, filters?: {
    departmentId?: string;
    projectId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    category?: string;
  }): MultiCompanyExpense[] {
    let expenses = Array.from(this.expenses.values())
      .filter(expense => expense.companyId === companyId);

    if (filters) {
      if (filters.departmentId) {
        expenses = expenses.filter(e => e.departmentId === filters.departmentId);
      }
      if (filters.projectId) {
        expenses = expenses.filter(e => e.projectId === filters.projectId);
      }
      if (filters.dateFrom) {
        expenses = expenses.filter(e => e.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        expenses = expenses.filter(e => e.date <= filters.dateTo!);
      }
      if (filters.status) {
        expenses = expenses.filter(e => e.status === filters.status);
      }
      if (filters.category) {
        expenses = expenses.filter(e => e.category === filters.category);
      }
    }

    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Generate comprehensive company analytics
   */
  public async generateCompanyAnalytics(companyId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<CompanyAnalytics> {
    const expenses = this.getCompanyExpenses(companyId);
    const departments = this.getCompanyDepartments(companyId);
    const projects = this.getCompanyProjects(companyId);

    // Filter expenses by period
    const now = new Date();
    const startDate = new Date(now);
    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const periodExpenses = expenses.filter(e => e.date >= startDate);
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const expensesByCategory: Record<string, number> = {};
    periodExpenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });

    // Department breakdown
    const expensesByDepartment: Record<string, number> = {};
    periodExpenses.forEach(expense => {
      if (expense.departmentId) {
        const dept = this.departments.get(expense.departmentId);
        if (dept) {
          expensesByDepartment[dept.name] = (expensesByDepartment[dept.name] || 0) + expense.amount;
        }
      }
    });

    // Project breakdown
    const expensesByProject: Record<string, number> = {};
    periodExpenses.forEach(expense => {
      if (expense.projectId) {
        const project = this.projects.get(expense.projectId);
        if (project) {
          expensesByProject[project.name] = (expensesByProject[project.name] || 0) + expense.amount;
        }
      }
    });

    // Top merchants
    const merchantMap = new Map<string, { amount: number; count: number }>();
    periodExpenses.forEach(expense => {
      if (expense.merchant) {
        const existing = merchantMap.get(expense.merchant) || { amount: 0, count: 0 };
        merchantMap.set(expense.merchant, {
          amount: existing.amount + expense.amount,
          count: existing.count + 1
        });
      }
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Compliance score calculation
    const approvedExpenses = periodExpenses.filter(e => e.status === 'approved').length;
    const complianceScore = periodExpenses.length > 0 ? (approvedExpenses / periodExpenses.length) * 100 : 100;

    // Budget utilization
    const totalBudget = departments.reduce((sum, dept) => sum + dept.budgetAllocated, 0);
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    return {
      companyId,
      period: `${period}-${now.toISOString().slice(0, 7)}`,
      totalExpenses,
      expensesByCategory,
      expensesByDepartment,
      expensesByProject,
      averageExpenseAmount: periodExpenses.length > 0 ? totalExpenses / periodExpenses.length : 0,
      topMerchants,
      complianceScore: Math.round(complianceScore),
      budgetUtilization: Math.round(budgetUtilization),
      trendAnalysis: {
        growth: this.calculateGrowthRate(companyId, period),
        seasonality: this.calculateSeasonality(companyId),
        forecast: this.forecastExpenses(companyId, period)
      }
    };
  }

  /**
   * Get available industries
   */
  public getAvailableIndustries(): string[] {
    return [...this.sriLankanIndustries];
  }

  /**
   * Get business expense categories
   */
  public getBusinessExpenseCategories(): string[] {
    return [...this.businessExpenseCategories];
  }

  /**
   * Approve an expense
   */
  public async approveExpense(expenseId: string, approverId: string): Promise<boolean> {
    const expense = this.expenses.get(expenseId);
    if (!expense) return false;

    expense.status = 'approved';
    expense.approvedBy = approverId;
    expense.approvedAt = new Date();
    expense.updatedAt = new Date();

    this.saveData();
    return true;
  }

  /**
   * Reject an expense
   */
  public async rejectExpense(expenseId: string, reason: string): Promise<boolean> {
    const expense = this.expenses.get(expenseId);
    if (!expense) return false;

    expense.status = 'rejected';
    expense.notes = reason;
    expense.updatedAt = new Date();

    this.saveData();
    return true;
  }

  // Private helper methods

  private async createDefaultDepartments(companyId: string): Promise<void> {
    const defaultDepartments = [
      { name: 'Administration', code: 'ADMIN', budget: 100000 },
      { name: 'Sales & Marketing', code: 'SALES', budget: 200000 },
      { name: 'Operations', code: 'OPS', budget: 150000 },
      { name: 'Finance', code: 'FIN', budget: 80000 },
      { name: 'Human Resources', code: 'HR', budget: 60000 },
      { name: 'Information Technology', code: 'IT', budget: 120000 }
    ];

    for (const dept of defaultDepartments) {
      await this.createDepartment({
        companyId,
        name: dept.name,
        code: dept.code,
        budgetAllocated: dept.budget,
        budgetUsed: 0,
        manager: 'System',
        costCenter: dept.code,
        isActive: true
      });
    }
  }

  private async createDefaultExpensePolicy(companyId: string): Promise<void> {
    const policy: ExpensePolicy = {
      id: this.generateId('policy'),
      companyId,
      name: 'Standard Expense Policy',
      description: 'Default expense policy for all employees',
      rules: [
        {
          category: 'Meals & Entertainment',
          dailyLimit: 5000,
          monthlyLimit: 100000,
          requiresReceipt: true,
          requiresApproval: false,
          approvalThreshold: 10000
        },
        {
          category: 'Travel & Accommodation',
          requiresReceipt: true,
          requiresApproval: true,
          approvalThreshold: 5000
        },
        {
          category: 'Office Supplies',
          monthlyLimit: 25000,
          requiresReceipt: false,
          requiresApproval: false,
          approvalThreshold: 5000
        }
      ],
      isActive: true
    };

    this.policies.set(policy.id, policy);
  }

  private async checkExpensePolicy(expense: MultiCompanyExpense): Promise<{
    policyViolations: string[];
    requiresApproval: boolean;
  }> {
    const violations: string[] = [];
    let requiresApproval = false;

    const policies = Array.from(this.policies.values())
      .filter(p => p.companyId === expense.companyId && p.isActive);

    for (const policy of policies) {
      const rule = policy.rules.find(r => r.category === expense.category);
      if (rule) {
        // Check daily limit
        if (rule.dailyLimit && expense.amount > rule.dailyLimit) {
          violations.push(`Exceeds daily limit of ${rule.dailyLimit} LKR for ${rule.category}`);
        }

        // Check approval threshold
        if (rule.approvalThreshold && expense.amount >= rule.approvalThreshold) {
          requiresApproval = true;
        }

        // Check if receipt is required
        if (rule.requiresReceipt && !expense.receiptUrl) {
          violations.push(`Receipt required for ${rule.category} expenses`);
        }

        // Check if approval is always required
        if (rule.requiresApproval) {
          requiresApproval = true;
        }
      }
    }

    return { policyViolations: violations, requiresApproval };
  }

  private async updateBudgets(expense: MultiCompanyExpense): Promise<void> {
    // Update department budget
    if (expense.departmentId) {
      const department = this.departments.get(expense.departmentId);
      if (department) {
        department.budgetUsed += expense.amount;
      }
    }

    // Update project budget
    if (expense.projectId) {
      const project = this.projects.get(expense.projectId);
      if (project) {
        project.spent += expense.amount;
      }
    }
  }

  private calculateGrowthRate(companyId: string, period: 'month' | 'quarter' | 'year'): number {
    // Simplified growth calculation
    const expenses = this.getCompanyExpenses(companyId);
    if (expenses.length < 2) return 0;

    const recent = expenses.slice(0, Math.floor(expenses.length / 2));
    const older = expenses.slice(Math.floor(expenses.length / 2));

    const recentTotal = recent.reduce((sum, e) => sum + e.amount, 0);
    const olderTotal = older.reduce((sum, e) => sum + e.amount, 0);

    return olderTotal > 0 ? ((recentTotal - olderTotal) / olderTotal) * 100 : 0;
  }

  private calculateSeasonality(companyId: string): Record<string, number> {
    const expenses = this.getCompanyExpenses(companyId);
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(expense => {
      const month = expense.date.toISOString().slice(5, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
    });

    return monthlyTotals;
  }

  private forecastExpenses(companyId: string, period: 'month' | 'quarter' | 'year'): number {
    const expenses = this.getCompanyExpenses(companyId);
    if (expenses.length === 0) return 0;

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgMonthly = totalAmount / Math.max(expenses.length / 30, 1);

    switch (period) {
      case 'month': return avgMonthly;
      case 'quarter': return avgMonthly * 3;
      case 'year': return avgMonthly * 12;
      default: return avgMonthly;
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultData(): void {
    // Create a default company if none exists
    if (this.companies.size === 0) {
      this.createDefaultCompany();
    }
  }

  private async createDefaultCompany(): Promise<void> {
    const defaultCompany = await this.createCompany({
      name: 'Tracksy Demo Company',
      displayName: 'Demo Company',
      industry: 'Information Technology',
      address: {
        street: '123 Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
        country: 'Sri Lanka'
      },
      currency: 'LKR',
      fiscalYearStart: '04-01', // April 1st
      isActive: true
    });

    this.setActiveCompany(defaultCompany.id);
  }

  private loadData(): void {
    try {
      // Load companies
      const companiesData = localStorage.getItem('tracksy-companies');
      if (companiesData) {
        const companies = JSON.parse(companiesData);
        companies.forEach((company: any) => {
          company.createdAt = new Date(company.createdAt);
          company.updatedAt = new Date(company.updatedAt);
          this.companies.set(company.id, company);
        });
      }

      // Load departments
      const deptData = localStorage.getItem('tracksy-departments');
      if (deptData) {
        const departments = JSON.parse(deptData);
        departments.forEach((dept: any) => {
          this.departments.set(dept.id, dept);
        });
      }

      // Load projects
      const projectData = localStorage.getItem('tracksy-projects');
      if (projectData) {
        const projects = JSON.parse(projectData);
        projects.forEach((project: any) => {
          project.startDate = new Date(project.startDate);
          project.endDate = new Date(project.endDate);
          this.projects.set(project.id, project);
        });
      }

      // Load policies
      const policyData = localStorage.getItem('tracksy-policies');
      if (policyData) {
        const policies = JSON.parse(policyData);
        policies.forEach((policy: any) => {
          this.policies.set(policy.id, policy);
        });
      }

      // Load multi-company expenses
      const expenseData = localStorage.getItem('tracksy-multi-expenses');
      if (expenseData) {
        const expenses = JSON.parse(expenseData);
        expenses.forEach((expense: any) => {
          expense.date = new Date(expense.date);
          expense.createdAt = new Date(expense.createdAt);
          expense.updatedAt = new Date(expense.updatedAt);
          if (expense.approvedAt) expense.approvedAt = new Date(expense.approvedAt);
          this.expenses.set(expense.id, expense);
        });
      }

      // Load active company
      const activeCompany = localStorage.getItem('tracksy-active-company');
      if (activeCompany && this.companies.has(activeCompany)) {
        this.currentCompanyId = activeCompany;
      }
    } catch (error) {
      console.error('Error loading multi-company data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('tracksy-companies', JSON.stringify(Array.from(this.companies.values())));
      localStorage.setItem('tracksy-departments', JSON.stringify(Array.from(this.departments.values())));
      localStorage.setItem('tracksy-projects', JSON.stringify(Array.from(this.projects.values())));
      localStorage.setItem('tracksy-policies', JSON.stringify(Array.from(this.policies.values())));
      localStorage.setItem('tracksy-multi-expenses', JSON.stringify(Array.from(this.expenses.values())));
    } catch (error) {
      console.error('Error saving multi-company data:', error);
    }
  }
}

export const multiCompanyService = MultiCompanyService.getInstance();