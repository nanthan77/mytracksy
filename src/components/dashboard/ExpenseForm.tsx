import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  InputAdornment,
  Chip,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AttachMoney,
  Category,
  Description,
  CalendarToday,
  Mic,
  Stop
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface ExpenseFormProps {
  onSubmit: (expense: any) => void;
  onCancel: () => void;
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Fuel',
  'Rent',
  'Insurance',
  'Investment',
  'Savings',
  'Other'
];

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Mobile Payment',
  'Cheque'
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date(),
    paymentMethod: '',
    location: '',
    tags: [] as string[]
  });
  const [errors, setErrors] = useState<any>({});
  const [isRecording, setIsRecording] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      date: date || new Date()
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          description: transcript
        }));
        setIsRecording(false);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (validateForm()) {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      onSubmit(expenseData);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Add New Expense
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={handleChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      LKR
                    </InputAdornment>
                  )
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            {/* Category */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleChange('category')}
                  label="Category"
                  startAdornment={<Category sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={startVoiceRecording}
                        disabled={isRecording}
                        color={isRecording ? "secondary" : "primary"}
                        startIcon={isRecording ? <Stop /> : <Mic />}
                        size="small"
                      >
                        {isRecording ? 'Recording...' : 'Voice'}
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday />
                        </InputAdornment>
                      )
                    }
                  }
                }}
              />
            </Grid>
            
            {/* Payment Method */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={handleChange('paymentMethod')}
                  label="Payment Method"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Location */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location (Optional)"
                value={formData.location}
                onChange={handleChange('location')}
                placeholder="Where did you spend this money?"
              />
            </Grid>
            
            {/* Tags */}
            <Grid item xs={12}>
              <Box>
                <TextField
                  label="Add Tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Button onClick={handleAddTag} size="small">
                        Add
                      </Button>
                    )
                  }}
                  sx={{ mb: 1 }}
                />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            
            {/* Sri Lankan Context */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                💡 Tip: Use voice commands in English, Sinhala, or Tamil. MyTracksy's AI will automatically categorize and analyze your expenses with Sri Lankan context awareness.
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          sx={{ minWidth: 120 }}
        >
          Add Expense
        </Button>
      </DialogActions>
    </LocalizationProvider>
  );
};