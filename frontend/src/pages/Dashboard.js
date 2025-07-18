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
  ToggleButtonGroup,
  Alert,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert as MuiAlert
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
import { incomeAPI, expenseAPI, transactionAPI, dashboardAPI } from '../services/api';
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

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    budgetProgress: [],
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
  const [dashboardAlerts, setDashboardAlerts] = useState([]);
  const [chartView, setChartView] = useState('monthly');
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
    fetchBudgetProgress();
  }, []);

  // Only fetch detailed data for charts/lists, not for summary
  const fetchDashboardData = async () => {
    try {
      const [incomeRes, expenseRes, recentRes] = await Promise.all([
        incomeAPI.getAll(),
        expenseAPI.getAll(),
        transactionAPI.getRecent()
      ]);
      setIncomeData(incomeRes.data);
      setExpenseData(expenseRes.data);
      setRecentTransactions(recentRes.data);
      // Trend calculation can remain if needed for charts
      const incomeArr = incomeRes.data;
      const expenseArr = expenseRes.data;
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

  const fetchBudgetProgress = async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setSummary(s => ({
        ...s,
        totalIncome: res.data.total_income,
        totalExpenses: res.data.total_expenses,
        balance: res.data.balance,
        budgetProgress: res.data.budget_progress || [],
      }));
      setDashboardAlerts(res.data.alerts || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Filter data for the selected period
  const now = new Date();
  let filteredIncome = incomeData;
  let filteredExpenses = expenseData;
  if (chartView === 'weekly') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    filteredIncome = incomeData.filter(i => new Date(i.date) >= startOfWeek);
    filteredExpenses = expenseData.filter(e => new Date(e.date) >= startOfWeek);
  } else if (chartView === 'monthly') {
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    filteredIncome = incomeData.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    filteredExpenses = expenseData.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
  } else if (chartView === 'yearly') {
    const thisYear = now.getFullYear();
    filteredIncome = incomeData.filter(i => new Date(i.date).getFullYear() === thisYear);
    filteredExpenses = expenseData.filter(e => new Date(e.date).getFullYear() === thisYear);
  }

  // Pie chart data for filtered income/expenses
  const incomeSources = {};
  filteredIncome.forEach((item) => {
    incomeSources[item.source] = (incomeSources[item.source] || 0) + item.amount;
  });
  const incomePieData = {
    labels: Object.keys(incomeSources),
    datasets: [
      {
        data: Object.values(incomeSources),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main || '#388e3c',
          theme.palette.warning.main || '#fbc02d',
          theme.palette.error.main || '#d32f2f',
          theme.palette.info.main || '#0288d1',
          '#7b1fa2',
        ],
        borderWidth: 1,
      },
    ],
  };
  const expenseCategories = {};
  filteredExpenses.forEach((item) => {
    expenseCategories[item.category] = (expenseCategories[item.category] || 0) + item.amount;
  });
  const expensePieData = {
    labels: Object.keys(expenseCategories),
    datasets: [
      {
        data: Object.values(expenseCategories),
        backgroundColor: [
          theme.palette.error.main || '#d32f2f',
          theme.palette.warning.main || '#fbc02d',
          theme.palette.success.main || '#388e3c',
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main || '#0288d1',
          '#7b1fa2',
        ],
        borderWidth: 1,
      },
    ],
  };
  // Bar chart data for the selected period
  let barLabels = [];
  let incomeBar = [];
  let expenseBar = [];
  if (chartView === 'weekly') {
    barLabels = Array(7).fill('').map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    });
    incomeBar = Array(7).fill(0);
    expenseBar = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().slice(0, 10);
      incomeBar[i] = filteredIncome.filter(e => e.date && e.date.slice(0, 10) === day).reduce((sum, e) => sum + e.amount, 0);
      expenseBar[i] = filteredExpenses.filter(e => e.date && e.date.slice(0, 10) === day).reduce((sum, e) => sum + e.amount, 0);
    }
  } else if (chartView === 'monthly') {
    barLabels = months;
    incomeBar = Array(12).fill(0);
    expenseBar = Array(12).fill(0);
    filteredIncome.forEach((item) => {
      const date = new Date(item.date);
      if (!isNaN(date)) incomeBar[date.getMonth()] += item.amount;
    });
    filteredExpenses.forEach((item) => {
      const date = new Date(item.date);
      if (!isNaN(date)) expenseBar[date.getMonth()] += item.amount;
    });
  } else if (chartView === 'yearly') {
    const thisYear = now.getFullYear();
    barLabels = Array(5).fill('').map((_, i) => (thisYear - 4 + i).toString());
    incomeBar = Array(5).fill(0);
    expenseBar = Array(5).fill(0);
    for (let i = 0; i < 5; i++) {
      const year = thisYear - 4 + i;
      incomeBar[i] = filteredIncome.filter(e => new Date(e.date).getFullYear() === year).reduce((sum, e) => sum + e.amount, 0);
      expenseBar[i] = filteredExpenses.filter(e => new Date(e.date).getFullYear() === year).reduce((sum, e) => sum + e.amount, 0);
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

  const handleChartView = (_, newView) => {
    if (newView) setChartView(newView);
  };

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  // Chart options for responsiveness and theme
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.primary },
        grid: { color: theme.palette.divider },
      },
      y: {
        ticks: { color: theme.palette.text.primary },
        grid: { color: theme.palette.divider },
      },
    },
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {getTimeOfDay()}, {user?.username || 'User'}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here’s your financial overview
      </Typography>
      {/* Alerts Banner */}
      {dashboardAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {dashboardAlerts.length === 1
            ? `Alert: ${dashboardAlerts[0].category} - ${dashboardAlerts[0].message}`
            : `You are over budget in ${dashboardAlerts.length} categories: ` + dashboardAlerts.map(a => `${a.category} (${a.message})`).join(', ')}
        </Alert>
      )}
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3, height: 180 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <BalanceIcon color="primary" sx={{ fontSize: 56 }} />
              <Box>
                <Typography variant="subtitle1" color="text.secondary">Balance</Typography>
                <Typography variant="h4" fontWeight={700}>{formatCurrency(summary.balance)}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3, height: 180 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <IncomeIcon color="success" sx={{ fontSize: 56 }} />
              <Box>
                <Typography variant="subtitle1" color="text.secondary">Total Income</Typography>
                <Typography variant="h4" fontWeight={700}>{formatCurrency(summary.totalIncome)}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3, height: 180 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <ExpenseIcon color="error" sx={{ fontSize: 56 }} />
              <Box>
                <Typography variant="subtitle1" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h4" fontWeight={700}>{formatCurrency(summary.totalExpenses)}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
      {/* Budget Progress Section */}
      <Card sx={{ mb: 3, p: 2, boxShadow: 2, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Budget Progress (This Month)</Typography>
          {summary.budgetProgress && summary.budgetProgress.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Spent</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.budgetProgress.map(bp => {
                      const percent = bp.budget > 0 ? Math.min(100, (bp.spent / bp.budget) * 100) : 100;
                      return (
                        <TableRow key={bp.category}>
                          <TableCell>{bp.category}</TableCell>
                          <TableCell>{formatCurrency(bp.budget)}</TableCell>
                          <TableCell>{formatCurrency(bp.spent)}</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              color={bp.over_under > 0 ? 'error' : 'success'}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                            <Typography variant="caption">{percent.toFixed(0)}%</Typography>
                          </TableCell>
                          <TableCell>
                            {bp.over_under > 0 ? (
                              <Chip label="Over" color="error" size="small" />
                            ) : (
                              <Chip label="Under" color="success" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">No budget data for this month.</Typography>
          )}
        </CardContent>
      </Card>
      {/* Charts Section with Toggle */}
      <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>Analytics</Typography>
          <ToggleButtonGroup
            value={chartView}
            exclusive
            onChange={handleChartView}
            size="small"
            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, boxShadow: 1, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Income by Source</Typography>
              <Box sx={{ height: { xs: 320, md: 400 }, width: '100%' }}>
                <Pie data={incomePieData} height={350} width={350} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, boxShadow: 1, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Expenses by Category</Typography>
              <Box sx={{ height: { xs: 320, md: 400 }, width: '100%' }}>
                <Pie data={expensePieData} height={350} width={350} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, boxShadow: 1, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Income vs Expenses (Bar Chart)</Typography>
              <Box sx={{ width: '100.2%', height: 400, minWidth: 0 }}>
                <Bar
                  data={barDataDynamic}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { x: { ticks: { autoSkip: false } } }
                  }}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Card>
      {/* Recent Transactions Section */}
      <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Recent Income</Typography>
              <List>
                {recentTransactions.income && recentTransactions.income.length > 0 ? recentTransactions.income.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemIcon><IncomeIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={item.source}
                      secondary={`${formatCurrency(item.amount)} • ${item.date ? new Date(item.date).toLocaleDateString() : ''}`}
                    />
                  </ListItem>
                )) : <ListItem><ListItemText primary="No recent income." /></ListItem>}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Recent Expenses</Typography>
              <List>
                {recentTransactions.expenses && recentTransactions.expenses.length > 0 ? recentTransactions.expenses.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemIcon><ExpenseIcon color="error" /></ListItemIcon>
                    <ListItemText
                      primary={item.category}
                      secondary={`${formatCurrency(item.amount)} • ${item.date ? new Date(item.date).toLocaleDateString() : ''}`}
                    />
                  </ListItem>
                )) : <ListItem><ListItemText primary="No recent expenses." /></ListItem>}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
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