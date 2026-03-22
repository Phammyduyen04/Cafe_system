const Availability = require('../models/availability.model');

const findByEmployeeId = async (employeeId) => await Availability.findOne({ employeeId });
const createOrUpdate = async (employeeId, data) => {
  return await Availability.findOneAndUpdate({ employeeId }, { $set: data }, { upsert: true, new: true });
};

module.exports = { findByEmployeeId, createOrUpdate };
