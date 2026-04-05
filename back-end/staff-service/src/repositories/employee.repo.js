const Employee = require('../models/employee.model');

const create = async (data) => await Employee.create(data);
const findAll = async (query) => await Employee.find(query).sort({ fullName: 1 });
const findMany = async (query, skip, limit) => await Employee.find(query).sort({ fullName: 1 }).skip(skip).limit(limit);
const count = async (query) => await Employee.countDocuments(query);
const findByEmployeeId = async (employeeId) => await Employee.findOne({ employeeId });
const findByAccountId = async (accountId) => await Employee.findOne({ accountId: String(accountId) });
const update = async (_id, data) => {
  await Employee.updateOne({ _id }, { $set: data });
  return await Employee.findById(_id);
};

module.exports = { create, findAll, findMany, count, findByEmployeeId, findByAccountId, update };
