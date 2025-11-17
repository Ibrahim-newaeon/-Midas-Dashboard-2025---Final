import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';

const AnalyticsPage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Analytics
          </Typography>
          <Button color="inherit" href="/dashboard">Dashboard</Button>
          <Button color="inherit" href="/campaigns">Campaigns</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, minHeight: 400 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Performance Overview
              </Typography>
              <Box sx={{ mt: 3, textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  📊 Analytics charts and reports will be displayed here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Connect your advertising platforms to see detailed analytics
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AnalyticsPage;
