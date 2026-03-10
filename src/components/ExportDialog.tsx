import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Email,
  PictureAsPdf,
  GridOn,
  DataArray,
  Schedule,
  AccountBalance,
  Close,
  Help,
  CloudDownload,
  Share
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { exportService, ExportOptions, EmailSchedule } from '../services/exportService';
import { useTranslation } from 'react-i18next';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: any[];
  onExportComplete?: (format: string, filename: string) => void;
}

interface ExportState {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: 'detailed' | 'summary' | 'tax' | 'business';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCultural: boolean;
  includeCategories: string[];
  includeCompanies: string[];
  currency: 'LKR' | 'USD' | 'EUR';
  language: 'en' | 'si' | 'ta';
  groupBy: 'date' | 'category' | 'company' | 'month';
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ 
  open, 
  onClose, 
  expenses,
  onExportComplete 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'export' | 'schedule' | 'tax'>('export');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [exportState, setExportState] = useState<ExportState>({
    format: 'pdf',
    template: 'detailed',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    },
    includeCultural: true,
    includeCategories: [],
    includeCompanies: [],
    currency: 'LKR',
    language: 'en',
    groupBy: 'date'
  });

  const [emailSchedule, setEmailSchedule] = useState({
    recipientEmail: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    template: 'detailed' as 'detailed' | 'summary' | 'tax' | 'business'
  });

  const [taxReportYear, setTaxReportYear] = useState(new Date().getFullYear());

  // Get unique categories and companies from expenses
  const availableCategories = [...new Set(expenses.map(e => e.category))];
  const availableCompanies = [...new Set(expenses.filter(e => e.companyId).map(e => e.companyId))];

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const inDateRange = expenseDate >= exportState.dateRange.startDate && 
                           expenseDate <= exportState.dateRange.endDate;
        
        const inCategories = exportState.includeCategories.length === 0 || 
                           exportState.includeCategories.includes(expense.category);
        
        const inCompanies = exportState.includeCompanies.length === 0 || 
                          exportState.includeCompanies.includes(expense.companyId);
        
        return inDateRange && inCategories && inCompanies;
      });

      const exportOptions: ExportOptions = {
        format: exportState.format,
        dateRange: exportState.dateRange,
        includeCategories: exportState.includeCategories,
        includeCompanies: exportState.includeCompanies,
        includeCultural: exportState.includeCultural,
        currency: exportState.currency,
        language: exportState.language,
        template: exportState.template,
        groupBy: exportState.groupBy
      };

      let blob: Blob;
      let filename: string;

      switch (exportState.format) {
        case 'pdf':
          blob = await exportService.exportToPDF(filteredExpenses, exportOptions);
          filename = `tracksy-expenses-${Date.now()}.pdf`;
          break;
        case 'excel':
          blob = await exportService.exportToExcel(filteredExpenses, exportOptions);
          filename = `tracksy-expenses-${Date.now()}.xlsx`;
          break;
        case 'csv':
          blob = await exportService.exportToCSV(filteredExpenses, exportOptions);
          filename = `tracksy-expenses-${Date.now()}.csv`;
          break;
        case 'json':
          const jsonData = JSON.stringify(filteredExpenses, null, 2);
          blob = new Blob([jsonData], { type: 'application/json' });
          filename = `tracksy-expenses-${Date.now()}.json`;
          break;
        default:
          throw new Error(`Unsupported format: ${exportState.format}`);
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Export completed successfully! Downloaded ${filename}`);
      onExportComplete?.(exportState.format, filename);
      
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleEmail = async () => {
    if (!emailSchedule.recipientEmail) {
      setError('Please enter a recipient email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scheduleId = await exportService.scheduleEmailReport({
        recipientEmail: emailSchedule.recipientEmail,
        frequency: emailSchedule.frequency,
        format: emailSchedule.format,
        template: emailSchedule.template,
        filters: exportState,
        isActive: true
      });

      setSuccess(`Email report scheduled successfully! Schedule ID: ${scheduleId}`);
      setEmailSchedule({
        recipientEmail: '',
        frequency: 'monthly',
        format: 'pdf',
        template: 'detailed'
      });
      
    } catch (err) {
      setError(`Scheduling failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTaxReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const taxReport = exportService.generateTaxReport(expenses, taxReportYear);
      
      // Create a detailed tax report as PDF
      const taxExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === taxReportYear;
      });

      const taxOptions: ExportOptions = {
        format: 'pdf',
        template: 'tax',
        dateRange: {
          startDate: new Date(taxReportYear, 0, 1),
          endDate: new Date(taxReportYear, 11, 31)
        },
        currency: 'LKR',
        language: 'en',
        includeCultural: true,
        groupBy: 'category'
      };

      const blob = await exportService.exportToPDF(taxExpenses, taxOptions);
      const filename = `tracksy-tax-report-${taxReportYear}.pdf`;

      // Download the tax report
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Tax report for ${taxReportYear} generated successfully!`);
      
    } catch (err) {
      setError(`Tax report generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatIcons = {
    pdf: <PictureAsPdf sx={{ color: '#f44336' }} />,
    excel: <GridOn sx={{ color: '#4caf50' }} />,
    csv: <DataArray sx={{ color: '#ff9800' }} />,
    json: <DataArray sx={{ color: '#2196f3' }} />
  };

  const templateDescriptions = {
    detailed: 'Complete expense details with all fields',
    summary: 'Condensed overview with totals and categories',
    tax: 'Tax-compliant report with deductible categories',
    business: 'Business-focused report with company breakdowns'
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDownload color="primary" />
            <Typography variant="h6">Export & Reports</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setActiveTab('export')}
              variant={activeTab === 'export' ? 'contained' : 'text'}
              size="small"
              startIcon={<Download />}
            >
              Export Data
            </Button>
            <Button
              onClick={() => setActiveTab('schedule')}
              variant={activeTab === 'schedule' ? 'contained' : 'text'}
              size="small"
              startIcon={<Schedule />}
            >
              Schedule Reports
            </Button>
            <Button
              onClick={() => setActiveTab('tax')}
              variant={activeTab === 'tax' ? 'contained' : 'text'}
              size="small"
              startIcon={<AccountBalance />}
            >
              Tax Reports
            </Button>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {activeTab === 'export' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Export Format
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Format</InputLabel>
                      <Select
                        value={exportState.format}
                        onChange={(e) => setExportState(prev => ({ 
                          ...prev, 
                          format: e.target.value as any 
                        }))}
                        startAdornment={formatIcons[exportState.format]}
                      >
                        <MenuItem value="pdf">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PictureAsPdf sx={{ color: '#f44336' }} />
                            PDF Report
                          </Box>
                        </MenuItem>
                        <MenuItem value="excel">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GridOn sx={{ color: '#4caf50' }} />
                            Excel Workbook
                          </Box>
                        </MenuItem>
                        <MenuItem value="csv">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DataArray sx={{ color: '#ff9800' }} />
                            CSV Data
                          </Box>
                        </MenuItem>
                        <MenuItem value="json">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DataArray sx={{ color: '#2196f3' }} />
                            JSON Data
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Template</InputLabel>
                      <Select
                        value={exportState.template}
                        onChange={(e) => setExportState(prev => ({ 
                          ...prev, 
                          template: e.target.value as any 
                        }))}
                      >
                        {Object.entries(templateDescriptions).map(([key, description]) => (
                          <MenuItem key={key} value={key}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <FormControl fullWidth>
                          <InputLabel>Currency</InputLabel>
                          <Select
                            value={exportState.currency}
                            onChange={(e) => setExportState(prev => ({ 
                              ...prev, 
                              currency: e.target.value as any 
                            }))}
                          >
                            <MenuItem value="LKR">🇱🇰 LKR</MenuItem>
                            <MenuItem value="USD">🇺🇸 USD</MenuItem>
                            <MenuItem value="EUR">🇪🇺 EUR</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <FormControl fullWidth>
                          <InputLabel>Language</InputLabel>
                          <Select
                            value={exportState.language}
                            onChange={(e) => setExportState(prev => ({ 
                              ...prev, 
                              language: e.target.value as any 
                            }))}
                          >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="si">සිංහල</MenuItem>
                            <MenuItem value="ta">தமிழ்</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <FormControl fullWidth>
                          <InputLabel>Group By</InputLabel>
                          <Select
                            value={exportState.groupBy}
                            onChange={(e) => setExportState(prev => ({ 
                              ...prev, 
                              groupBy: e.target.value as any 
                            }))}
                          >
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="category">Category</MenuItem>
                            <MenuItem value="company">Company</MenuItem>
                            <MenuItem value="month">Month</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={exportState.includeCultural}
                          onChange={(e) => setExportState(prev => ({ 
                            ...prev, 
                            includeCultural: e.target.checked 
                          }))}
                        />
                      }
                      label="Include Cultural & Religious Expenses"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Filters & Date Range
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <DatePicker
                          label="Start Date"
                          value={exportState.dateRange.startDate}
                          onChange={(date) => date && setExportState(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, startDate: date } 
                          }))}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <DatePicker
                          label="End Date"
                          value={exportState.dateRange.endDate}
                          onChange={(date) => date && setExportState(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, endDate: date } 
                          }))}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Categories ({availableCategories.length} available)
                    </Typography>
                    <Box sx={{ mb: 2, maxHeight: 120, overflow: 'auto' }}>
                      {availableCategories.map(category => (
                        <Chip
                          key={category}
                          label={category}
                          size="small"
                          sx={{ m: 0.5 }}
                          variant={exportState.includeCategories.includes(category) ? 'filled' : 'outlined'}
                          onClick={() => {
                            setExportState(prev => ({
                              ...prev,
                              includeCategories: prev.includeCategories.includes(category)
                                ? prev.includeCategories.filter(c => c !== category)
                                : [...prev.includeCategories, category]
                            }));
                          }}
                        />
                      ))}
                    </Box>

                    {availableCompanies.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Companies ({availableCompanies.length} available)
                        </Typography>
                        <Box sx={{ maxHeight: 80, overflow: 'auto' }}>
                          {availableCompanies.map(company => (
                            <Chip
                              key={company}
                              label={company}
                              size="small"
                              sx={{ m: 0.5 }}
                              variant={exportState.includeCompanies.includes(company) ? 'filled' : 'outlined'}
                              onClick={() => {
                                setExportState(prev => ({
                                  ...prev,
                                  includeCompanies: prev.includeCompanies.includes(company)
                                    ? prev.includeCompanies.filter(c => c !== company)
                                    : [...prev.includeCompanies, company]
                                }));
                              }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 'schedule' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Schedule Automated Email Reports
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Recipient Email"
                      type="email"
                      value={emailSchedule.recipientEmail}
                      onChange={(e) => setEmailSchedule(prev => ({ 
                        ...prev, 
                        recipientEmail: e.target.value 
                      }))}
                      sx={{ mb: 2 }}
                    />
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={emailSchedule.frequency}
                        onChange={(e) => setEmailSchedule(prev => ({ 
                          ...prev, 
                          frequency: e.target.value as any 
                        }))}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Format</InputLabel>
                      <Select
                        value={emailSchedule.format}
                        onChange={(e) => setEmailSchedule(prev => ({ 
                          ...prev, 
                          format: e.target.value as any 
                        }))}
                      >
                        <MenuItem value="pdf">PDF Report</MenuItem>
                        <MenuItem value="excel">Excel Workbook</MenuItem>
                        <MenuItem value="csv">CSV Data</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Template</InputLabel>
                      <Select
                        value={emailSchedule.template}
                        onChange={(e) => setEmailSchedule(prev => ({ 
                          ...prev, 
                          template: e.target.value as any 
                        }))}
                      >
                        <MenuItem value="detailed">Detailed</MenuItem>
                        <MenuItem value="summary">Summary</MenuItem>
                        <MenuItem value="tax">Tax Report</MenuItem>
                        <MenuItem value="business">Business Report</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Email reports will use the same filters and settings 
                    configured in the Export tab. The report will be automatically generated 
                    and sent according to your schedule.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tax' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sri Lankan Tax Report Generator
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tax Year"
                      type="number"
                      value={taxReportYear}
                      onChange={(e) => setTaxReportYear(parseInt(e.target.value))}
                      inputProps={{ min: 2020, max: new Date().getFullYear() }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Button
                      variant="contained"
                      onClick={handleGenerateTaxReport}
                      disabled={loading}
                      startIcon={<AccountBalance />}
                      size="large"
                    >
                      Generate Tax Report
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  <strong>Tax Report includes:</strong>
                </Typography>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Personal vs Business expense breakdown</li>
                  <li>Deductible expenses by category</li>
                  <li>Cultural and religious donations</li>
                  <li>Monthly expense analysis</li>
                  <li>Tax-compliant formatting for Sri Lankan IRD</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          
          {activeTab === 'export' && (
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={loading}
              startIcon={<Download />}
            >
              Export Data
            </Button>
          )}
          
          {activeTab === 'schedule' && (
            <Button
              variant="contained"
              onClick={handleScheduleEmail}
              disabled={loading}
              startIcon={<Email />}
            >
              Schedule Report
            </Button>
          )}
          
          {activeTab === 'tax' && (
            <Button
              variant="contained"
              onClick={handleGenerateTaxReport}
              disabled={loading}
              startIcon={<AccountBalance />}
            >
              Generate Tax Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExportDialog;