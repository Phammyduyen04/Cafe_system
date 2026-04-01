require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorHandler } = require('../../shared');
const employeeRoutes = require('./routes/employee.routes');
const shiftRoutes = require('./routes/shift.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB - Staff DB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Staff Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/staff/employees', employeeRoutes);
app.use('/api/staff/shifts', shiftRoutes);
app.use('/api/staff/attendance', attendanceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Staff Service is running on port ${PORT}`);
});
