const Shift = require('../models/shift.model');

const create = async (data) => await Shift.create(data);
const findAll = async (query) => await Shift.find(query).sort({ workingDate: 1, startTime: 1 });
const findByShiftId = async (shiftId) => await Shift.findOne({ shiftId });
const update = async (shiftId, data) => await Shift.findOneAndUpdate({ shiftId }, data, { new: true });

module.exports = { create, findAll, findByShiftId, update };
