const Shift = require('../models/shift.model');

const create = async (data) => await Shift.create(data);
const findAll = async (query) => await Shift.find(query).sort({ workingDate: 1, startTime: 1 });
const findMany = async (query, skip, limit) => await Shift.find(query).sort({ workingDate: 1, startTime: 1 }).skip(skip).limit(limit);
const count = async (query) => await Shift.countDocuments(query);
const findByShiftId = async (shiftId) => await Shift.findOne({ shiftId });
const findById = async (id) => await Shift.findById(id);
const update = async (_id, data) => {
  await Shift.updateOne({ _id }, { $set: data });
  return await Shift.findById(_id);
};

module.exports = { create, findAll, findMany, count, findByShiftId, findById, update };
