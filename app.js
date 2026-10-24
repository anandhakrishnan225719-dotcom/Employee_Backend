// Task1: initiate app and run server at 3000
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies sent by the Employee App.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Task2: create mongoDB connection
// Set MONGODB_URI to your MongoDB Atlas connection string before starting the app.
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_ATLAS_CONNECTION_STRING';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Employee collection/model
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  salary: { type: Number, required: true }
}, { timestamps: true });

const Employee = mongoose.models.Employee ||
  mongoose.model('Employee', employeeSchema);

// Keep the provided static-file middleware.
app.use(express.static(path.join(__dirname+'/dist/FrontEnd')));

// Task 2: write API with error handling and appropriate API mentioned in the TODO below

// Get all employees
app.get('/api/employeelist', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    console.error('Failed to retrieve employees:', err);
    res.status(500).json({ message: 'Failed to retrieve employees' });
  }
});

// Get one employee by MongoDB id
app.get('/api/employeelist/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json(employee);
  } catch (err) {
    console.error('Failed to retrieve employee:', err);
    res.status(500).json({ message: 'Failed to retrieve employee' });
  }
});

// Add an employee. Expected body: { name, location, position, salary }
app.post('/api/employeelist', async (req, res) => {
  try {
    const { name, location, position, salary } = req.body;
    if (name == null || location == null || position == null || salary == null ||
        String(name).trim() === '' || String(location).trim() === '' ||
        String(position).trim() === '' || !Number.isFinite(Number(salary))) {
      return res.status(400).json({ message: 'name, location, position and numeric salary are required' });
    }
    const employee = await Employee.create({
      name: String(name).trim(),
      location: String(location).trim(),
      position: String(position).trim(),
      salary: Number(salary)
    });
    res.status(201).json(employee);
  } catch (err) {
    console.error('Failed to add employee:', err);
    res.status(500).json({ message: 'Failed to add employee' });
  }
});

// Delete one employee by MongoDB id
app.delete('/api/employeelist/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json({ message: 'Employee deleted successfully', employee });
  } catch (err) {
    console.error('Failed to delete employee:', err);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
});

// Update an employee. Expected body: { _id, name, location, position, salary }
// The frontend sends the employee object in the request body.
app.put('/api/employeelist', async (req, res) => {
  try {
    const { _id, id, name, location, position, salary } = req.body;
    const employeeId = _id || id;
    if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ message: 'A valid employee _id is required' });
    }
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (position !== undefined) updates.position = String(position).trim();
    if (salary !== undefined) {
      if (!Number.isFinite(Number(salary))) {
        return res.status(400).json({ message: 'salary must be numeric' });
      }
      updates.salary = Number(salary);
    }
    const employee = await Employee.findByIdAndUpdate(
      employeeId, updates, { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json(employee);
  } catch (err) {
    console.error('Failed to update employee:', err);
    res.status(500).json({ message: 'Failed to update employee' });
  }
});

//! dont delete this code. it connects the front end file.
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});

// Start server after registering routes.
app.listen(PORT, () => console.log(`Employee App backend listening on port ${PORT}`));
