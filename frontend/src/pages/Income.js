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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, FileDownload as FileDownloadIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { incomeAPI } from '../services/api';
import axios from 'axios';

const recurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const Income = () => {
  const [incomeList, setIncomeList] = useState([]);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('monthly');
  const [nextOccurrence, setNextOccurrence] = useState('');

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const res = await incomeAPI.getAll();
      setIncomeList(res.data);
    } catch (err) {
      setError('Failed to fetch income.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!amount || !source) {
      setError('Amount and source are required.');
      return;
    }
    try {
      await incomeAPI.add(amount, source, date || new Date().toISOString(), isRecurring, recurrence, nextOccurrence);
      setSuccess('Income added successfully!');
      setAmount('');
      setSource('');
      setDate('');
      setIsRecurring(false);
      setRecurrence('monthly');
      setNextOccurrence('');
      fetchIncome();
    } catch (err) {
      setError('Failed to add income.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await incomeAPI.delete(id);
      setIncomeList(incomeList.filter((item) => item._id !== id));
    } catch (err) {
      setError('Failed to delete income.');
    }
  };

  const handleExport = async () => {
    try {
      const res = await incomeAPI.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'income.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to export income.');
    }
  };

  // Edit functionality
  const handleEditOpen = (item) => {
    setEditData({ ...item });
    setEditOpen(true);
    setIsRecurring(item.is_recurring || false);
    setRecurrence(item.recurrence || 'monthly');
    setNextOccurrence(item.next_occurrence ? item.next_occurrence.slice(0, 10) : '');
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
    setIsRecurring(false);
    setRecurrence('monthly');
    setNextOccurrence('');
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/income/${editData._id}`, {
        amount: editData.amount,
        source: editData.source,
        date: editData.date,
        is_recurring: editData.is_recurring,
        recurrence: editData.recurrence,
        next_occurrence: editData.next_occurrence
      });
      setSuccess('Income updated successfully!');
      setEditOpen(false);
      setEditData(null);
      fetchIncome();
    } catch (err) {
      setError('Failed to update income.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Income Management
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleAddIncome}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
              <TextField
                label="Source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                fullWidth
                required
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
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={<Checkbox checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />}
                label="Recurring"
              />
            </Grid>
            {isRecurring && (
              <>
                <Grid item xs={12} sm={3}>
                  <Select
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value)}
                    fullWidth
                    displayEmpty
                  >
                    {recurrenceOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Next Occurrence"
                    type="date"
                    value={nextOccurrence}
                    onChange={e => setNextOccurrence(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                fullWidth
              >
                Add Income
              </Button>
            </Grid>
          </Grid>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">All Income</Typography>
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
              <TableCell>Source</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomeList.map((item) => (
              <TableRow key={item._id} hover>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell>{item.source}</TableCell>
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
            {incomeList.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No income records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Income</DialogTitle>
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
            label="Source"
            name="source"
            value={editData?.source || ''}
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
          <FormControlLabel
            control={<Checkbox checked={editData?.is_recurring || false} onChange={e => setEditData({ ...editData, is_recurring: e.target.checked })} />}
            label="Recurring"
          />
          {editData?.is_recurring && (
            <>
              <Select
                margin="dense"
                label="Recurrence"
                name="recurrence"
                value={editData?.recurrence || 'monthly'}
                onChange={handleEditChange}
                fullWidth
                displayEmpty
              >
                {recurrenceOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
              <TextField
                margin="dense"
                label="Next Occurrence"
                name="next_occurrence"
                type="date"
                value={editData?.next_occurrence ? editData.next_occurrence.slice(0, 10) : ''}
                onChange={handleEditChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Income; 