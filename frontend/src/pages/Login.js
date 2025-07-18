import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  Link,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Lottie from 'lottie-react';
import calculatorMan from '../assets/calculator-man.json';
import { Checkbox, FormControlLabel, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeMode } from '../context/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left: Animation and branding */}
      <Grid item xs={0} md={6} sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f7f8fa',
        flexDirection: 'column',
        height: '100vh',
        width: '50vw',
        maxWidth: '50vw',
        flexBasis: '50%',
      }}>
        <Box sx={{ width: 400, maxWidth: '90%' }}>
          <Lottie animationData={calculatorMan} loop={true} />
        </Box>
        <Typography variant="h4" fontWeight={700} color="primary" sx={{ mt: 4 }}>
          SmartBudget
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Take control of your finances
        </Typography>
      </Grid>
      {/* Right: Login Form */}
      <Grid item xs={12} md={6} sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        height: '100vh',
        width: '50vw',
        maxWidth: '50vw',
        flexBasis: '50%',
      }}>
        <Container maxWidth="xs">
          <Paper elevation={6} sx={{ p: 5, borderRadius: 5, position: 'relative', backdropFilter: 'blur(2px)', boxShadow: 6 }}>
            {/* Theme Toggle */}
            <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
              <IconButton onClick={toggleTheme} color="primary" size="large">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
            <Typography component="h1" variant="h5" align="center" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
              Welcome Back 👋
            </Typography>
            <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to your account
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Email or Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-user" style={{ color: '#888' }}></i>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-lock" style={{ color: '#888' }}></i>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={e => setRemember(e.target.checked)} color="primary" />}
                  label="Remember Me"
                />
                <Link component={RouterLink} to="#" variant="body2">
                  Forgot Password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2, py: 1.5, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, boxShadow: 2, textTransform: 'uppercase', letterSpacing: 1 }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <Typography align="center" sx={{ mt: 1 }}>
                New on our platform?{' '}
                <Link component={RouterLink} to="/register" variant="body2">
                  Create an account
                </Link>
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <IconButton color="primary"><i className="fab fa-facebook-f"></i></IconButton>
                <IconButton color="primary"><i className="fab fa-twitter"></i></IconButton>
                <IconButton color="primary"><i className="fab fa-github"></i></IconButton>
                <IconButton color="primary"><i className="fab fa-google"></i></IconButton>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Grid>
    </Grid>
  );
};

export default Login; 