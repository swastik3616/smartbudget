import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete as DeleteIcon, FileDownload as FileDownloadIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { expenseAPI } from '../services/api';
import axios from 'axios';

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other'
];

const Expenses = () => {
  const [expenseList, setExpenseList] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.getAll();
      setExpenseList(res.data);
    } catch (err) {
      setError('Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!amount || !category) {
      setError('Amount and category are required.');
      return;
    }
    try {
      await expenseAPI.add(amount, category, description, date || new Date().toISOString());
      setSuccess('Expense added successfully!');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate('');
      fetchExpenses();
    } catch (err) {
      setError('Failed to add expense.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseAPI.delete(id);
      setExpenseList(expenseList.filter((item) => item._id !== id));
    } catch (err) {
      setError('Failed to delete expense.');
    }
  };

  const handleExport = async () => {
    try {
      const res = await expenseAPI.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to export expenses.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Edit functionality
  const handleEditOpen = (item) => {
    setEditData({ ...item });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/expenses/${editData._id}`, {
        amount: editData.amount,
        category: editData.category,
        description: editData.description,
        date: editData.date
      });
      setSuccess('Expense updated successfully!');
      setEditOpen(false);
      setEditData(null);
      fetchExpenses();
    } catch (err) {
      setError('Failed to update expense.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Expenses Management
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                required
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                fullWidth
              >
                Add Expense
              </Button>
            </Grid>
          </Grid>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">All Expenses</Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Export to Excel
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenseList.map((item) => (
              <TableRow key={item._id} hover>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : ''}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditOpen(item)}
                      sx={{ opacity: 0.7, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(item._id)}
                      sx={{ opacity: 0.7, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {expenseList.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No expense records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Amount"
            name="amount"
            type="number"
            value={editData?.amount || ''}
            onChange={handleEditChange}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            margin="dense"
            select
            label="Category"
            name="category"
            value={editData?.category || ''}
            onChange={handleEditChange}
            fullWidth
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={editData?.description || ''}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Date"
            name="date"
            type="date"
            value={editData?.date ? editData.date.slice(0, 10) : ''}
            onChange={handleEditChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses; 