const Employee = require('../models/employee.model');

const create = async (data) => await Employee.create(data);
const findAll = async (query) => await Employee.find(query).sort({ fullName: 1 });
const findByEmployeeId = async (employeeId) => await Employee.findOne({ employeeId });
const update = async (employeeId, data) => await Employee.findOneAndUpdate({ employeeId }, data, { new: true });

module.exports = { create, findAll, findByEmployeeId, update };
