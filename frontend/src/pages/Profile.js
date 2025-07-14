import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper sx={{ p: 4, minWidth: 320, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Profile Verification
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Username: {user?.username || 'N/A'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Your account is verified. If you need to update your details, please contact support.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 