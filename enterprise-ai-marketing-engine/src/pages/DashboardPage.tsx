import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Button,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CampaignIcon from '@mui/icons-material/Campaign';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';

const DashboardPage: React.FC = () => {
  const stats = [
    { label: 'Total Campaigns', value: '24', icon: <CampaignIcon />, color: '#1976d2' },
    { label: 'Total Spend', value: '$45,234', icon: <AttachMoneyIcon />, color: '#2e7d32' },
    { label: 'Conversions', value: '1,284', icon: <TrendingUpIcon />, color: '#ed6c02' },
    { label: 'Reach', value: '2.4M', icon: <PeopleIcon />, color: '#9c27b0' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enterprise AI Marketing Engine
          </Typography>
          <Button color="inherit">Campaigns</Button>
          <Button color="inherit">Analytics</Button>
          <Button color="inherit">Settings</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your marketing campaigns.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: stat.color,
                        color: 'white',
                        p: 1,
                        borderRadius: 1,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography variant="h4">{stat.value}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Performance
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  📊 Your campaigns are performing well across all platforms
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="Meta: 12 Active" sx={{ mr: 1, mb: 1 }} color="primary" />
                  <Chip label="Google: 8 Active" sx={{ mr: 1, mb: 1 }} color="success" />
                  <Chip label="TikTok: 3 Active" sx={{ mr: 1, mb: 1 }} color="warning" />
                  <Chip label="Snapchat: 1 Active" sx={{ mr: 1, mb: 1 }} color="secondary" />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button fullWidth variant="outlined" sx={{ mb: 1 }}>
                  Create Campaign
                </Button>
                <Button fullWidth variant="outlined" sx={{ mb: 1 }}>
                  View Analytics
                </Button>
                <Button fullWidth variant="outlined">
                  Import Data
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;
