import React from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <Box>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 10, // offset for fixed Navbar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 