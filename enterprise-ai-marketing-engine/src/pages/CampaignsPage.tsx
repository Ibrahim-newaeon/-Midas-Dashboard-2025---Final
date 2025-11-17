import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  AppBar,
  Toolbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };
  const campaigns = [
    { id: 1, name: 'Summer Sale 2024', platform: 'Meta', status: 'Active', spend: '$1,234', conversions: 45 },
    { id: 2, name: 'Product Launch', platform: 'Google', status: 'Active', spend: '$2,456', conversions: 89 },
    { id: 3, name: 'Brand Awareness', platform: 'TikTok', status: 'Paused', spend: '$567', conversions: 12 },
    { id: 4, name: 'Retargeting Q4', platform: 'Snapchat', status: 'Active', spend: '$890', conversions: 34 },
  ];

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'default';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campaigns
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>Analytics</Button>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">All Campaigns</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Campaign
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Campaign Name</strong></TableCell>
                <TableCell><strong>Platform</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Spend</strong></TableCell>
                <TableCell align="right"><strong>Conversions</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>
                    <Chip label={campaign.platform} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={campaign.status} color={getStatusColor(campaign.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">{campaign.spend}</TableCell>
                  <TableCell align="right">{campaign.conversions}</TableCell>
                  <TableCell align="right">
                    <Button size="small">View</Button>
                    <Button size="small">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default CampaignsPage;
