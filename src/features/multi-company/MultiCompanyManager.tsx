import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Business,
  Add,
  Edit,
  Delete,
  ExpandMore,
  AccountBalance,
  Group,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Analytics,
  Settings,
  AttachMoney,
  Receipt,
  Approval
} from '@mui/icons-material';
import {
  multiCompanyService,
  Company,
  Department,
  Project,
  MultiCompanyExpense,
  CompanyAnalytics
} from '../../services/multiCompanyService';

interface MultiCompanyManagerProps {
  onExpenseAdded?: (expense: MultiCompanyExpense) => void;
}

export const MultiCompanyManager: React.FC<MultiCompanyManagerProps> = ({
  onExpenseAdded
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<MultiCompanyExpense[]>([]);
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    industry: '',
    currency: 'LKR',
    fiscalYearStart: '04-01',
    isActive: true,
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: '',
      country: 'Sri Lanka'
    }
  });
  
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    code: '',
    budgetAllocated: 0,
    manager: '',
    costCenter: '',
    isActive: true
  });
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    code: '',
    description: '',
    budget: 0,
    startDate: new Date(),
    endDate: new Date(),
    status: 'active',
    departments: [],
    manager: ''
  });

  const [newExpense, setNewExpense] = useState<Partial<MultiCompanyExpense>>({
    amount: 0,
    category: '',
    description: '',
    paymentMethod: 'cash',
    tags: [],
    metadata: {
      source: 'manual'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentCompany) {
      loadCompanyData(currentCompany.id);
    }
  }, [currentCompany]);

  const loadData = async () => {
    const companiesList = multiCompanyService.getUserCompanies();
    setCompanies(companiesList);
    
    const current = multiCompanyService.getCurrentCompany();
    if (current) {
      setCurrentCompany(current);
    } else if (companiesList.length > 0) {
      setCurrentCompany(companiesList[0]);
      multiCompanyService.setActiveCompany(companiesList[0].id);
    }
  };

  const loadCompanyData = async (companyId: string) => {
    const depts = multiCompanyService.getCompanyDepartments(companyId);
    const projs = multiCompanyService.getCompanyProjects(companyId);
    const exps = multiCompanyService.getCompanyExpenses(companyId);
    const analyticsData = await multiCompanyService.generateCompanyAnalytics(companyId);
    
    setDepartments(depts);
    setProjects(projs);
    setExpenses(exps);
    setAnalytics(analyticsData);
  };

  const handleCompanySwitch = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      multiCompanyService.setActiveCompany(companyId);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const company = await multiCompanyService.createCompany(newCompany as any);
      await loadData();
      setShowCompanyDialog(false);
      setNewCompany({
        name: '',
        industry: '',
        currency: 'LKR',
        fiscalYearStart: '04-01',
        isActive: true,
        address: {
          street: '',
          city: '',
          district: '',
          postalCode: '',
          country: 'Sri Lanka'
        }
      });
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleCreateDepartment = async () => {
    if (!currentCompany) return;
    
    try {
      await multiCompanyService.createDepartment({
        ...newDepartment,
        companyId: currentCompany.id,
        budgetUsed: 0
      } as any);
      
      await loadCompanyData(currentCompany.id);
      setShowDepartmentDialog(false);
      setNewDepartment({
        name: '',
        code: '',
        budgetAllocated: 0,
        manager: '',
        costCenter: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!currentCompany) return;
    
    try {
      await multiCompanyService.createProject({
        ...newProject,
        companyId: currentCompany.id
      } as any);
      
      await loadCompanyData(currentCompany.id);
      setShowProjectDialog(false);
      setNewProject({
        name: '',
        code: '',
        description: '',
        budget: 0,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        departments: [],
        manager: ''
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateExpense = async () => {
    if (!currentCompany) return;
    
    try {
      const result = await multiCompanyService.addMultiCompanyExpense({
        ...newExpense,
        userId: 'current-user',
        companyId: currentCompany.id,
        date: new Date(),
        tags: newExpense.tags || []
      } as any);
      
      await loadCompanyData(currentCompany.id);
      setShowExpenseDialog(false);
      
      if (onExpenseAdded) {
        onExpenseAdded(result.expense);
      }
      
      // Show policy violations if any
      if (result.policyViolations.length > 0) {
        alert(`Policy violations: ${result.policyViolations.join(', ')}`);
      }
      
      setNewExpense({
        amount: 0,
        category: '',
        description: '',
        paymentMethod: 'cash',
        tags: [],
        metadata: {
          source: 'manual'
        }
      });
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const renderCompanyOverview = () => (
    <Grid container spacing={3}>
      {/* Company Selector */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                Company Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCompanyDialog(true)}
              >
                Add Company
              </Button>
            </Box>
            
            {currentCompany && (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Active Company</InputLabel>
                  <Select
                    value={currentCompany.id}
                    onChange={(e) => handleCompanySwitch(e.target.value)}
                  >
                    {companies.map(company => (
                      <MenuItem key={company.id} value={company.id}>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                            {company.name.charAt(0)}
                          </Avatar>
                          {company.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2"><strong>Industry:</strong> {currentCompany.industry}</Typography>
                    <Typography variant="body2"><strong>Currency:</strong> {currentCompany.currency}</Typography>
                    <Typography variant="body2"><strong>Fiscal Year:</strong> Starts {currentCompany.fiscalYearStart}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2"><strong>Address:</strong></Typography>
                    <Typography variant="caption">
                      {currentCompany.address.street}, {currentCompany.address.city}<br />
                      {currentCompany.address.district}, {currentCompany.address.postalCode}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Stats */}
      {analytics && (
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {analytics.totalExpenses.toLocaleString()} LKR
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {analytics.complianceScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compliance Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {analytics.budgetUtilization}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget Utilization
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {Object.keys(analytics.expensesByDepartment).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Departments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Grid>
  );

  const renderDepartments = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h6">
          <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
          Departments
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowDepartmentDialog(true)}
        >
          Add Department
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {departments.map(department => (
          <Grid item xs={12} md={6} key={department.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                  <Typography variant="h6">{department.name}</Typography>
                  <Chip label={department.code} size="small" />
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Manager:</strong> {department.manager}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Cost Center:</strong> {department.costCenter}
                </Typography>
                
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    Budget Utilization: {department.budgetAllocated > 0 ? 
                      Math.round((department.budgetUsed / department.budgetAllocated) * 100) : 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={department.budgetAllocated > 0 ? 
                      Math.min((department.budgetUsed / department.budgetAllocated) * 100, 100) : 0}
                    color={department.budgetUsed > department.budgetAllocated ? 'error' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {department.budgetUsed.toLocaleString()} / {department.budgetAllocated.toLocaleString()} LKR
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderProjects = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h6">
          <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowProjectDialog(true)}
        >
          Add Project
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {projects.map(project => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                  <Typography variant="h6">{project.name}</Typography>
                  <Chip 
                    label={project.status} 
                    size="small" 
                    color={project.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Code:</strong> {project.code}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Manager:</strong> {project.manager}
                </Typography>
                {project.client && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Client:</strong> {project.client}
                  </Typography>
                )}
                
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    Budget Progress: {project.budget > 0 ? 
                      Math.round((project.spent / project.budget) * 100) : 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={project.budget > 0 ? 
                      Math.min((project.spent / project.budget) * 100, 100) : 0}
                    color={project.spent > project.budget ? 'error' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {project.spent.toLocaleString()} / {project.budget.toLocaleString()} LKR
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="between" mt={2}>
                  <Typography variant="caption">
                    Start: {project.startDate.toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption">
                    End: {project.endDate.toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderExpenses = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h6">
          <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
          Company Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowExpenseDialog(true)}
        >
          Add Expense
        </Button>
      </Box>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.slice(0, 10).map(expense => {
            const department = departments.find(d => d.id === expense.departmentId);
            return (
              <TableRow key={expense.id}>
                <TableCell>{expense.date.toLocaleDateString()}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{department?.name || 'N/A'}</TableCell>
                <TableCell>{expense.amount.toLocaleString()} LKR</TableCell>
                <TableCell>
                  <Chip 
                    label={expense.status}
                    size="small"
                    color={
                      expense.status === 'approved' ? 'success' :
                      expense.status === 'rejected' ? 'error' :
                      expense.status === 'submitted' ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {expense.status === 'submitted' && (
                    <Box>
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => multiCompanyService.approveExpense(expense.id, 'current-user')}
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => multiCompanyService.rejectExpense(expense.id, 'Manager decision')}
                      >
                        <Warning />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
        Company Analytics
      </Typography>
      
      {analytics && (
        <Grid container spacing={3}>
          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                {Object.entries(analytics.expensesByCategory).map(([category, amount]) => (
                  <Box key={category} mb={1}>
                    <Box display="flex" justifyContent="between">
                      <Typography variant="body2">{category}</Typography>
                      <Typography variant="body2">{amount.toLocaleString()} LKR</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(amount / analytics.totalExpenses) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Department Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expenses by Department</Typography>
                {Object.entries(analytics.expensesByDepartment).map(([department, amount]) => (
                  <Box key={department} mb={1}>
                    <Box display="flex" justifyContent="between">
                      <Typography variant="body2">{department}</Typography>
                      <Typography variant="body2">{amount.toLocaleString()} LKR</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(amount / analytics.totalExpenses) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Merchants */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Merchants</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Merchant</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                      <TableCell align="right">Avg per Transaction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topMerchants.slice(0, 5).map(merchant => (
                      <TableRow key={merchant.name}>
                        <TableCell>{merchant.name}</TableCell>
                        <TableCell align="right">{merchant.amount.toLocaleString()} LKR</TableCell>
                        <TableCell align="right">{merchant.count}</TableCell>
                        <TableCell align="right">
                          {Math.round(merchant.amount / merchant.count).toLocaleString()} LKR
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<Business />} />
        <Tab label="Departments" icon={<Group />} />
        <Tab label="Projects" icon={<Assignment />} />
        <Tab label="Expenses" icon={<Receipt />} />
        <Tab label="Analytics" icon={<Analytics />} />
      </Tabs>

      {activeTab === 0 && renderCompanyOverview()}
      {activeTab === 1 && renderDepartments()}
      {activeTab === 2 && renderProjects()}
      {activeTab === 3 && renderExpenses()}
      {activeTab === 4 && renderAnalytics()}

      {/* Company Dialog */}
      <Dialog open={showCompanyDialog} onClose={() => setShowCompanyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                >
                  {multiCompanyService.getAvailableIndustries().map(industry => (
                    <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={newCompany.address?.street}
                onChange={(e) => setNewCompany({
                  ...newCompany, 
                  address: {...newCompany.address!, street: e.target.value}
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={newCompany.address?.city}
                onChange={(e) => setNewCompany({
                  ...newCompany, 
                  address: {...newCompany.address!, city: e.target.value}
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="District"
                value={newCompany.address?.district}
                onChange={(e) => setNewCompany({
                  ...newCompany, 
                  address: {...newCompany.address!, district: e.target.value}
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompanyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">Create Company</Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={showDepartmentDialog} onClose={() => setShowDepartmentDialog(false)}>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department Code"
                value={newDepartment.code}
                onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget Allocated (LKR)"
                type="number"
                value={newDepartment.budgetAllocated}
                onChange={(e) => setNewDepartment({...newDepartment, budgetAllocated: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manager"
                value={newDepartment.manager}
                onChange={(e) => setNewDepartment({...newDepartment, manager: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDepartmentDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDepartment} variant="contained">Create Department</Button>
        </DialogActions>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onClose={() => setShowProjectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Code"
                value={newProject.code}
                onChange={(e) => setNewProject({...newProject, code: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Budget (LKR)"
                type="number"
                value={newProject.budget}
                onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newProject.startDate?.toISOString().split('T')[0]}
                onChange={(e) => setNewProject({...newProject, startDate: new Date(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newProject.endDate?.toISOString().split('T')[0]}
                onChange={(e) => setNewProject({...newProject, endDate: new Date(e.target.value)})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">Create Project</Button>
        </DialogActions>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)}>
        <DialogTitle>Add Company Expense</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount (LKR)"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  {multiCompanyService.getBusinessExpenseCategories().map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newExpense.departmentId || ''}
                  onChange={(e) => setNewExpense({...newExpense, departmentId: e.target.value})}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={newExpense.projectId || ''}
                  onChange={(e) => setNewExpense({...newExpense, projectId: e.target.value})}
                >
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExpense} variant="contained">Add Expense</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};