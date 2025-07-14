import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  Fab,
  Tooltip as MuiTooltip,
  useTheme,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { incomeAPI, expenseAPI, transactionAPI } from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useAuth } from '../context/AuthContext';

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Animated Counter
const AnimatedNumber = ({ value, prefix = '', decimals = 2 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    let end = value;
    let duration = 800;
    let startTime = null;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    // eslint-disable-next-line
  }, [value]);
  return (
    <span>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState({
    income: [],
    expenses: []
  });
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState({ income: 0, expenses: 0, balance: 0 });
  const [trendView, setTrendView] = useState('monthly');
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [incomeRes, expenseRes, recentRes] = await Promise.all([
        incomeAPI.getAll(),
        expenseAPI.getAll(),
        transactionAPI.getRecent()
      ]);
      const incomeArr = incomeRes.data;
      const expenseArr = expenseRes.data;
      const totalIncome = incomeArr.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = expenseArr.reduce((sum, item) => sum + item.amount, 0);
      setSummary({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      });
      setRecentTransactions(recentRes.data);
      setIncomeData(incomeArr);
      setExpenseData(expenseArr);
      // Calculate trend (compare this month to last month)
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = (thisMonth + 11) % 12;
      const incomeThisMonth = incomeArr.filter(i => new Date(i.date).getMonth() === thisMonth).reduce((sum, i) => sum + i.amount, 0);
      const incomeLastMonth = incomeArr.filter(i => new Date(i.date).getMonth() === lastMonth).reduce((sum, i) => sum + i.amount, 0);
      const expenseThisMonth = expenseArr.filter(i => new Date(i.date).getMonth() === thisMonth).reduce((sum, i) => sum + i.amount, 0);
      const expenseLastMonth = expenseArr.filter(i => new Date(i.date).getMonth() === lastMonth).reduce((sum, i) => sum + i.amount, 0);
      setTrend({
        income: incomeLastMonth ? ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100 : 0,
        expenses: expenseLastMonth ? ((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100 : 0,
        balance: (incomeThisMonth - expenseThisMonth) - (incomeLastMonth - expenseLastMonth)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Pie chart for income by source
  const incomeSources = {};
  incomeData.forEach((item) => {
    incomeSources[item.source] = (incomeSources[item.source] || 0) + item.amount;
  });
  const incomePieData = {
    labels: Object.keys(incomeSources),
    datasets: [
      {
        data: Object.values(incomeSources),
        backgroundColor: [
          '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pie chart for expenses by category
  const expenseCategories = {};
  expenseData.forEach((item) => {
    expenseCategories[item.category] = (expenseCategories[item.category] || 0) + item.amount;
  });
  const expensePieData = {
    labels: Object.keys(expenseCategories),
    datasets: [
      {
        data: Object.values(expenseCategories),
        backgroundColor: [
          '#d32f2f', '#fbc02d', '#388e3c', '#1976d2', '#7b1fa2', '#0288d1', '#c2185b'
        ],
        borderWidth: 1,
      },
    ],
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const incomeByMonth = Array(12).fill(0);
  const expenseByMonth = Array(12).fill(0);
  incomeData.forEach((item) => {
    const date = new Date(item.date);
    if (!isNaN(date)) incomeByMonth[date.getMonth()] += item.amount;
  });
  expenseData.forEach((item) => {
    const date = new Date(item.date);
    if (!isNaN(date)) expenseByMonth[date.getMonth()] += item.amount;
  });
  const barData = {
    labels: months,
    datasets: [
      {
        type: 'bar',
        label: 'Income',
        backgroundColor: '#1976d2',
        data: incomeByMonth,
        borderRadius: 6,
        barPercentage: 0.6
      },
      {
        type: 'bar',
        label: 'Expenses',
        backgroundColor: '#d32f2f',
        data: expenseByMonth,
        borderRadius: 6,
        barPercentage: 0.6
      },
    ],
  };

  // Bar chart data for toggle
  let barLabels = months;
  let incomeBar = incomeByMonth;
  let expenseBar = expenseByMonth;
  if (trendView === 'weekly') {
    // Group by last 7 days
    barLabels = Array(7).fill('').map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    });
    incomeBar = Array(7).fill(0);
    expenseBar = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().slice(0, 10);
      incomeBar[i] = incomeData.filter(e => e.date && e.date.slice(0, 10) === day).reduce((sum, e) => sum + e.amount, 0);
      expenseBar[i] = expenseData.filter(e => e.date && e.date.slice(0, 10) === day).reduce((sum, e) => sum + e.amount, 0);
    }
  } else if (trendView === 'yearly') {
    // Group by year (last 5 years)
    const thisYear = new Date().getFullYear();
    barLabels = Array(5).fill('').map((_, i) => (thisYear - 4 + i).toString());
    incomeBar = Array(5).fill(0);
    expenseBar = Array(5).fill(0);
    for (let i = 0; i < 5; i++) {
      const year = thisYear - 4 + i;
      incomeBar[i] = incomeData.filter(e => new Date(e.date).getFullYear() === year).reduce((sum, e) => sum + e.amount, 0);
      expenseBar[i] = expenseData.filter(e => new Date(e.date).getFullYear() === year).reduce((sum, e) => sum + e.amount, 0);
    }
  }
  const barDataDynamic = {
    labels: barLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Income',
        backgroundColor: '#1976d2',
        data: incomeBar,
        borderRadius: 6,
        barPercentage: 0.6
      },
      {
        type: 'bar',
        label: 'Expenses',
        backgroundColor: '#d32f2f',
        data: expenseBar,
        borderRadius: 6,
        barPercentage: 0.6
      },
    ],
  };
  const handleTrendView = (_, newView) => {
    if (newView) setTrendView(newView);
  };

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  // Glassmorphism/gradient card style
  const cardStyle = {
    background: 'rgba(255,255,255,0.7)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.18)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1, sm: 2 }, py: 1, bgcolor: '#f7f9fb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight={700} mb={1.5} mt={1}>
        {getTimeOfDay()}, {user?.username || 'User'}!
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Here’s your financial overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...cardStyle, minHeight: 160, background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2, width: 56, height: 56 }}>
                  <IncomeIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6">Total Income</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} align="right">
                <AnimatedNumber value={summary.totalIncome} prefix="₹" />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...cardStyle, minHeight: 160, background: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'error.main', mr: 2, width: 56, height: 56 }}>
                  <ExpenseIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6">Total Expenses</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} align="right">
                <AnimatedNumber value={summary.totalExpenses} prefix="₹" />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...cardStyle, minHeight: 160, background: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'info.main', mr: 2, width: 56, height: 56 }}>
                  <BalanceIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6">Balance</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} align="right">
                <AnimatedNumber value={summary.balance} prefix="₹" />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 3 }} />

      {/* --- Trends & Charts Section --- */}
      <Typography variant="h5" fontWeight={600} mb={2}>Trends & Charts</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: 1, borderRadius: 2, minHeight: 400 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PieChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Income by Source</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Pie data={incomePieData} options={{ plugins: { legend: { position: 'bottom' } }, animation: { animateRotate: true, animateScale: true }, interaction: { mode: 'nearest', intersect: true } }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: 1, borderRadius: 2, minHeight: 400 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PieChartIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Expenses by Category</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Pie data={expensePieData} options={{ plugins: { legend: { position: 'bottom' } }, animation: { animateRotate: true, animateScale: true }, interaction: { mode: 'nearest', intersect: true } }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 3, boxShadow: 1, borderRadius: 2, minHeight: 400 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <BarChartIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Income & Expenses Over Time</Typography>
              </Box>
              <ToggleButtonGroup
                value={trendView}
                exclusive
                onChange={handleTrendView}
                size="small"
                color="primary"
              >
                <ToggleButton value="weekly">Weekly</ToggleButton>
                <ToggleButton value="monthly">Monthly</ToggleButton>
                <ToggleButton value="yearly">Yearly</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Bar data={barDataDynamic} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, animation: { duration: 1200 }, interaction: { mode: 'index', intersect: false }, tooltips: { enabled: true } }} />
          </Paper>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 3 }} />

      {/* --- Recent Transactions Section --- */}
      <Typography variant="h5" fontWeight={600} mb={2}>Recent Transactions</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recent Income
            </Typography>
            <List>
              {recentTransactions.income.map((item) => (
                <ListItem key={item._id}>
                  <ListItemIcon>
                    <IncomeIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.source}
                    secondary={formatCurrency(item.amount)}
                  />
                  <Chip 
                    label={formatCurrency(item.amount)} 
                    color="success" 
                    size="small" 
                  />
                </ListItem>
              ))}
              {recentTransactions.income.length === 0 && (
                <ListItem>
                  <ListItemText secondary="No recent income" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recent Expenses
            </Typography>
            <List>
              {recentTransactions.expenses.map((item) => (
                <ListItem key={item._id}>
                  <ListItemIcon>
                    <ExpenseIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.category}
                    secondary={item.description || 'No description'}
                  />
                  <Chip 
                    label={formatCurrency(item.amount)} 
                    color="error" 
                    size="small" 
                  />
                </ListItem>
              ))}
              {recentTransactions.expenses.length === 0 && (
                <ListItem>
                  <ListItemText secondary="No recent expenses" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      {/* --- Quick Action Floating Button --- */}
      <MuiTooltip title="Add Income or Expense" placement="left">
        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, boxShadow: 4 }} href="/income">
          <AddIcon />
        </Fab>
      </MuiTooltip>
    </Box>
  );
};

export default Dashboard; 