import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, adminLogin, isLoading } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminUsername: 'admin',
    adminPassword: 'admin@2025123',
  });
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      googleLogin();
      // Navigation will be handled by the auth context
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminLogin(formData.adminUsername, formData.adminPassword);
      navigate('/admin', { replace: true });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          Welcome to Kamp Kart
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to continue shopping
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
          <Tab label="User Login" />
          <Tab label="Admin Login" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* User Login */}
          <Box component="form" onSubmit={handleUserLogin}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            sx={{ mb: 2, py: 1.5 }}
          >
            Continue with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Button
                variant="text"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Sign up here
              </Button>
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Admin Login */}
          <Box component="form" onSubmit={handleAdminLogin}>
            <TextField
              fullWidth
              label="Admin Username"
              name="adminUsername"
              value={formData.adminUsername}
              onChange={handleInputChange}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Admin Password"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Admin Sign In'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Admin credentials are pre-filled. Use: admin / admin@2025123
            </Typography>
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LoginPage;