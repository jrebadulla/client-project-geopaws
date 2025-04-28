// src/components/Reports.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper, Modal, Box, Typography } from '@mui/material';
import Sidebar from './Sidebar';

// Modal style for viewing more details
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null); // For the modal
  const [open, setOpen] = useState(false);

  // Fetch reports from Firestore
  const fetchReports = async () => {
    const reportsCollection = collection(db, 'pet_reports');
    const reportsSnapshot = await getDocs(reportsCollection);
    const reportsList = await Promise.all(reportsSnapshot.docs.map(async (doc) => {
      const report = doc.data();

      // Fetch the user's name based on the email
      const userQuery = query(collection(db, 'users'), where('email', '==', report.user));
      const userSnapshot = await getDocs(userQuery);
      let userName = 'Unknown';
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        userName = `${userData.firstname} ${userData.lastname}`; // Concatenate first and last name
      }

      return { id: doc.id, ...report, reportedBy: userName };
    }));

    setReports(reportsList);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle modal open/close
  const handleOpen = (report) => {
    setSelectedReport(report);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Pet Reports
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pet Name</TableCell>
                <TableCell>Location Lost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reported By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.pet_name}</TableCell>
                  <TableCell>{report.location_lost}</TableCell>
                  <TableCell>{report.status}</TableCell>
                  <TableCell>{report.reportedBy}</TableCell>
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => handleOpen(report)}>
                      View More
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal for viewing full report details */}
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            {selectedReport && (
              <>
                <Typography variant="h6" id="modal-modal-title">
                  {selectedReport.pet_name} Report
                </Typography>
                <Typography sx={{ mt: 2 }} id="modal-modal-description">
                  <strong>Date Lost:</strong> {selectedReport.date_lost} <br />
                  <strong>Time Lost:</strong> {selectedReport.time_lost} <br />
                  <strong>Location Lost:</strong> {selectedReport.location_lost} <br />
                  <strong>Status:</strong> {selectedReport.status} <br />
                  <strong>Reported By:</strong> {selectedReport.reportedBy} <br />
                  <strong>Additional Info:</strong> {selectedReport.additional_info} <br />
                  <strong>Image URL:</strong> {selectedReport.image ? <a href={selectedReport.image} target="_blank" rel="noopener noreferrer">View Image</a> : 'No Image'} <br />
                </Typography>
                <Button variant="contained" color="secondary" onClick={handleClose} sx={{ mt: 2 }}>
                  Close
                </Button>
              </>
            )}
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default Reports;
