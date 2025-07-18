import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar, Button, Stack, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { avatarAPI } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [profilePic, setProfilePic] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAvatar = async () => {
      setLoading(true);
      try {
        const res = await avatarAPI.get();
        setProfilePic(res.data.profilePic || '');
        setPreview(res.data.profilePic || '');
      } catch (e) {
        setProfilePic('');
        setPreview('');
      }
      setLoading(false);
    };
    fetchAvatar();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await avatarAPI.update(profilePic, '');
      setMessage('Profile picture updated!');
    } catch (e) {
      setMessage('Failed to update profile picture.');
    }
    setSaving(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper sx={{ p: 4, minWidth: 340, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : preview ? (
            <Avatar src={profilePic || undefined} sx={{ width: 80, height: 80, mx: 'auto', fontSize: 48 }} />
          ) : (
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', fontSize: 48 }} />
          )}
        </Box>
        <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
          <Button variant="outlined" component="label">
            Upload Image
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </Button>
        </Stack>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading} fullWidth>
          {saving ? 'Saving...' : 'Save Picture'}
        </Button>
        {message && (
          <Typography color={message.includes('Failed') ? 'error' : 'success.main'} sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        <Typography variant="h6" sx={{ mt: 4 }}>
          Username: {user?.username || 'N/A'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 