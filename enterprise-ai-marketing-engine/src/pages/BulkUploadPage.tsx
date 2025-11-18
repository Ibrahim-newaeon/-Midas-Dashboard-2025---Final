import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FileUpload from '@/components/FileUpload';

interface UploadResult {
  fileName: string;
  status: 'success' | 'error';
  recordsProcessed: number;
  errors?: string[];
}

const BulkUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleUpload = async (files: File[]): Promise<void> => {
    // Simulate file processing
    const results: UploadResult[] = [];

    for (const file of files) {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random success/failure
      const isSuccess = Math.random() > 0.3;

      results.push({
        fileName: file.name,
        status: isSuccess ? 'success' : 'error',
        recordsProcessed: isSuccess ? Math.floor(Math.random() * 100) + 10 : 0,
        errors: isSuccess ? undefined : ['Invalid data format in row 5', 'Missing required field: campaign_name'],
      });
    }

    setUploadResults((prev) => [...results, ...prev]);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bulk Upload
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate('/campaigns')}>Campaigns</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>Analytics</Button>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bulk Campaign Upload
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Upload CSV or Excel files to create or update multiple campaigns at once
        </Typography>

        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <FileUpload onUpload={handleUpload} accept=".csv,.xlsx,.xls" multiple maxSize={10} />
          </Grid>

          {/* Instructions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                File Format Guidelines
              </Typography>
              <Typography variant="body2" paragraph>
                Your file should include the following columns:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  <strong>campaign_name</strong> - Name of the campaign (required)
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>platform</strong> - META, GOOGLE, TIKTOK, or SNAPCHAT (required)
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>budget</strong> - Daily budget amount (required)
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>objective</strong> - Campaign objective (optional)
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>status</strong> - ACTIVE, PAUSED, or DRAFT (optional)
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Download our sample template to ensure your file is formatted correctly.
              </Alert>
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                Download Sample Template
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Upload History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>File Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Records Processed</strong></TableCell>
                    <TableCell><strong>Errors</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.fileName}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.status}
                          color={result.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{result.recordsProcessed}</TableCell>
                      <TableCell>
                        {result.errors ? (
                          <Box>
                            {result.errors.map((error, i) => (
                              <Typography key={i} variant="caption" display="block" color="error">
                                • {error}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="success.main">
                            No errors
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BulkUploadPage;
