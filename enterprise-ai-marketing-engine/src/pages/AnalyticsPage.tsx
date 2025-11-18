import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  // Sample data for charts
  const performanceData = [
    { date: 'Jan 1', impressions: 12000, clicks: 850, conversions: 42, spend: 1200 },
    { date: 'Jan 8', impressions: 15000, clicks: 1050, conversions: 58, spend: 1450 },
    { date: 'Jan 15', impressions: 18000, clicks: 1350, conversions: 72, spend: 1800 },
    { date: 'Jan 22', impressions: 22000, clicks: 1650, conversions: 89, spend: 2100 },
    { date: 'Jan 29', impressions: 25000, clicks: 1950, conversions: 105, spend: 2400 },
    { date: 'Feb 5', impressions: 28000, clicks: 2250, conversions: 125, spend: 2700 },
    { date: 'Feb 12', impressions: 31000, clicks: 2500, conversions: 142, spend: 3000 },
  ];

  const platformData = [
    { name: 'Meta', spend: 12500, conversions: 425, color: '#1877F2' },
    { name: 'Google', spend: 18200, conversions: 680, color: '#4285F4' },
    { name: 'TikTok', spend: 8900, conversions: 215, color: '#000000' },
    { name: 'Snapchat', spend: 5634, conversions: 124, color: '#FFFC00' },
  ];

  const conversionData = [
    { platform: 'Meta', value: 425 },
    { platform: 'Google', value: 680 },
    { platform: 'TikTok', value: 215 },
    { platform: 'Snapchat', value: 124 },
  ];

  const COLORS = ['#1877F2', '#4285F4', '#000000', '#FFFC00'];

  const stats = [
    { label: 'Total Impressions', value: '151K', change: '+12.5%' },
    { label: 'Total Clicks', value: '11.6K', change: '+8.3%' },
    { label: 'Total Conversions', value: '1,444', change: '+15.2%' },
    { label: 'Average ROAS', value: '3.2x', change: '+0.4x' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Analytics
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate('/campaigns')}>Campaigns</Button>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stat.change}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Performance Trend - Line Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Performance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="conversions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="clicks" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Conversions by Platform - Pie Chart */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Conversions by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ platform, value }) => `${platform}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Spend by Platform - Bar Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Spend by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spend" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Impressions & Clicks Trend - Line Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Impressions & Clicks Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AnalyticsPage;
