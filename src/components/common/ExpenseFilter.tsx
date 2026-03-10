import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  Paper,
  Grid,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ExpenseFilter } from '../../types';
import { useCategories } from '../../hooks/useCategories';

interface ExpenseFilterProps {
  filter: ExpenseFilter;
  onFilterChange: (filter: ExpenseFilter) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
}

const ExpenseFilterComponent: React.FC<ExpenseFilterProps> = ({
  filter,
  onFilterChange,
  onApplyFilter,
  onClearFilter
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const { categories } = useCategories();

  const handleFilterChange = (field: keyof ExpenseFilter, value: any) => {
    onFilterChange({
      ...filter,
      [field]: value
    });
  };

  const hasActiveFilters = Boolean(
    filter.category ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.minAmount ||
    filter.maxAmount ||
    filter.paymentMethod ||
    filter.search
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.category) count++;
    if (filter.dateFrom) count++;
    if (filter.dateTo) count++;
    if (filter.minAmount) count++;
    if (filter.maxAmount) count++;
    if (filter.paymentMethod) count++;
    if (filter.search) count++;
    return count;
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search and Filter Toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search expenses..."
          value={filter.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <Button
          variant={showFilters ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ minWidth: 120 }}
        >
          Filters
          {hasActiveFilters && (
            <Chip
              label={getActiveFilterCount()}
              size="small"
              color="primary"
              sx={{ ml: 1, height: 20 }}
            />
          )}
        </Button>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Category Filter */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filter.category || ''}
                    label="Category"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: 8 }}>{category.icon}</span>
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Payment Method Filter */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={filter.paymentMethod || ''}
                    label="Payment Method"
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  >
                    <MenuItem value="">All Methods</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Date From */}
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="From Date"
                  value={filter.dateFrom || null}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>

              {/* Date To */}
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="To Date"
                  value={filter.dateTo || null}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>

              {/* Min Amount */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Min Amount"
                  type="number"
                  value={filter.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>

              {/* Max Amount */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Max Amount"
                  type="number"
                  value={filter.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>

            {/* Filter Actions */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={onClearFilter}
                disabled={!hasActiveFilters}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={onApplyFilter}
              >
                Apply Filters
              </Button>
            </Box>
          </LocalizationProvider>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default ExpenseFilterComponent;