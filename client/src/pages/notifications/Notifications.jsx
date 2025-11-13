import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Sms as SmsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const Notifications = () => {
  const [overdueMembers, setOverdueMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [monthsOverdue, setMonthsOverdue] = useState(3);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', data: null });
  const [smsResults, setSmsResults] = useState([]);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch overdue members
  const fetchOverdueMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/notifications/overdue-members?monthsOverdue=${monthsOverdue}`,
        {
          headers: { 'x-auth-token': token }
        }
      );

      setOverdueMembers(response.data.members || []);
      setAlert({
        show: true,
        type: 'info',
        message: `Found ${response.data.count} member(s) with payments overdue for ${monthsOverdue}+ months`
      });
    } catch (error) {
      console.error('Error fetching overdue members:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch overdue members'
      });
    } finally {
      setLoading(false);
    }
  };

  // Send SMS to individual member
  const sendSMSToMember = async (memberId, memberName) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/notifications/send-overdue-sms/${memberId}`,
        { monthsOverdue },
        {
          headers: { 'x-auth-token': token }
        }
      );

      setAlert({
        show: true,
        type: 'success',
        message: `SMS sent successfully to ${memberName}`
      });

      // Refresh the list
      fetchOverdueMembers();
    } catch (error) {
      console.error('Error sending SMS:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.response?.data?.message || `Failed to send SMS to ${memberName}`
      });
    } finally {
      setSending(false);
      setConfirmDialog({ open: false, type: '', data: null });
    }
  };

  // Send bulk SMS to all overdue members
  const sendBulkSMS = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/notifications/send-bulk-overdue-sms`,
        { monthsOverdue },
        {
          headers: { 'x-auth-token': token }
        }
      );

      setSmsResults(response.data.results || []);
      setAlert({
        show: true,
        type: 'success',
        message: response.data.message
      });

      // Refresh the list
      fetchOverdueMembers();
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to send bulk SMS notifications'
      });
    } finally {
      setSending(false);
      setConfirmDialog({ open: false, type: '', data: null });
    }
  };

  // Load overdue members on component mount
  useEffect(() => {
    fetchOverdueMembers();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmsIcon fontSize="large" />
          SMS Notifications - Overdue Payments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send SMS reminders to members with overdue monthly payments
        </Typography>
      </Box>

      {/* Alert */}
      {alert.show && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ ...alert, show: false })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Months Overdue"
              type="number"
              value={monthsOverdue}
              onChange={(e) => setMonthsOverdue(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              sx={{ width: 150 }}
              inputProps={{ min: 1, max: 12 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOverdueMembers}
              disabled={loading}
            >
              Refresh List
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={() => setConfirmDialog({ open: true, type: 'bulk', data: null })}
              disabled={loading || sending || overdueMembers.length === 0}
            >
              Send SMS to All ({overdueMembers.length})
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Overdue Members Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={overdueMembers.length} color="error">
              <WarningIcon color="warning" />
            </Badge>
            Overdue Members
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : overdueMembers.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No overdue members found!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All members are up to date with their payments.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Application #</strong></TableCell>
                    <TableCell><strong>Member Name</strong></TableCell>
                    <TableCell><strong>Contact Number</strong></TableCell>
                    <TableCell><strong>Last Payment Date</strong></TableCell>
                    <TableCell><strong>Last Amount</strong></TableCell>
                    <TableCell><strong>Months Overdue</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueMembers.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>{member.applicationNumber || 'N/A'}</TableCell>
                      <TableCell>{member.fullName}</TableCell>
                      <TableCell>
                        {member.contactNumber ? (
                          <Chip 
                            label={member.contactNumber} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            label="No Phone" 
                            size="small" 
                            color="error" 
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(member.lastPaymentDate)}</TableCell>
                      <TableCell>
                        {member.lastPaymentAmount 
                          ? `₱${parseFloat(member.lastPaymentAmount).toFixed(2)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.monthsSinceLastPayment 
                            ? `${member.monthsSinceLastPayment} months`
                            : 'Never paid'}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Send SMS Reminder">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => setConfirmDialog({ 
                              open: true, 
                              type: 'single', 
                              data: member 
                            })}
                            disabled={!member.contactNumber || sending}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !sending && setConfirmDialog({ open: false, type: '', data: null })}
      >
        <DialogTitle>
          {confirmDialog.type === 'bulk' 
            ? 'Send Bulk SMS Notifications' 
            : 'Send SMS Notification'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'bulk'
              ? `Are you sure you want to send SMS notifications to all ${overdueMembers.length} overdue member(s)? This action will send payment reminders to all members with payments overdue for ${monthsOverdue}+ months.`
              : `Are you sure you want to send an SMS notification to ${confirmDialog.data?.fullName}?`
            }
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Message Preview:</strong><br />
              Dear {confirmDialog.type === 'bulk' ? '[Member Name]' : confirmDialog.data?.fullName},<br /><br />
              This is a reminder from BAFCI that your monthly payment is past due for {monthsOverdue} month(s).<br /><br />
              Please settle your payment at your earliest convenience to avoid further late fees.<br /><br />
              Thank you for your cooperation.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, type: '', data: null })}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={() => {
              if (confirmDialog.type === 'bulk') {
                sendBulkSMS();
              } else {
                sendSMSToMember(confirmDialog.data.id, confirmDialog.data.fullName);
              }
            }}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send SMS'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Notifications;
