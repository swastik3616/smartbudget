import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, TextField, Button, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, InputLabel, FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api, { categoryAPI } from '../services/api';

const periods = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' }
];

const defaultCategories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'
];

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(defaultCategories);

  // Fetch dynamic categories
  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getExpenseCategories();
      let merged = [...defaultCategories];
      if (res.data.categories && res.data.categories.length > 0) {
        merged = Array.from(new Set([...defaultCategories, ...res.data.categories]));
      }
      setCategories(merged);
    } catch (err) {
      setCategories(defaultCategories);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data);
    } catch (err) {
      setError('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, []);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError('');
    if (!category || !amount) {
      setError('Category and amount are required');
      return;
    }
    try {
      await api.post('/budgets', { category, period, amount });
      setCategory('');
      setAmount('');
      fetchBudgets();
    } catch (err) {
      setError('Failed to add budget');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      setError('Failed to delete budget');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Budget Management
      </Typography>
      <Box component="form" onSubmit={handleAddBudget} sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={e => setCategory(e.target.value)}
            renderValue={val => val || 'Select or type category'}
          >
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Optionally, allow manual entry for new categories */}
        {/* <TextField
          label="Or enter new category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          sx={{ minWidth: 120 }}
        /> */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={e => setPeriod(e.target.value)}
          >
            {periods.map(p => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>
          Add/Update
        </Button>
      </Box>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgets.map(budget => (
              <TableRow key={budget._id}>
                <TableCell>{budget.category}</TableCell>
                <TableCell>{budget.period}</TableCell>
                <TableCell>{budget.amount}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(budget._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Budget;