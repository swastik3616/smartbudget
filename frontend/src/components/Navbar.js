import React, { useState } from 'react';
import { AppBar, Toolbar, Tabs, Tab, Box, Avatar, Typography, Menu, MenuItem, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Income', path: '/income' },
  { label: 'Expenses', path: '/expenses' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  // Find the current tab index
  const currentTab = navLinks.findIndex(link => location.pathname.startsWith(link.path));

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
      <Toolbar>
        {/* Logo on the left */}
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, flexGrow: 1 }}>
          SmartBudget
        </Typography>
        {/* Navigation and avatar on the right */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tabs
            value={currentTab === -1 ? 0 : currentTab}
            onChange={(_, idx) => navigate(navLinks[idx].path)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ minHeight: 48 }}
          >
            {navLinks.map((link) => (
              <Tab key={link.path} label={link.label} sx={{ minWidth: 100 }} />
            ))}
          </Tabs>
          <IconButton onClick={handleAvatarClick} sx={{ ml: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 