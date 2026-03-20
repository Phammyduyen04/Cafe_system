const toppingService = require('../services/topping.service');

const getAllToppings = async (req, res, next) => {
  try {
    const onlyAvailable = req.query.available === 'true';
    const toppings = await toppingService.getAllToppings(onlyAvailable);
    res.json({ success: true, data: toppings });
  } catch (err) {
    next(err);
  }
};

const getToppingById = async (req, res, next) => {
  try {
    const topping = await toppingService.getToppingById(req.params.id);
    res.json({ success: true, data: topping });
  } catch (err) {
    next(err);
  }
};

const createTopping = async (req, res, next) => {
  try {
    const topping = await toppingService.createTopping(req.body, req.user?.username);
    res.status(201).json({ success: true, data: topping });
  } catch (err) {
    next(err);
  }
};

const updateTopping = async (req, res, next) => {
  try {
    const topping = await toppingService.updateTopping(req.params.id, req.body);
    res.json({ success: true, data: topping });
  } catch (err) {
    next(err);
  }
};

const deleteTopping = async (req, res, next) => {
  try {
    await toppingService.deleteTopping(req.params.id);
    res.json({ success: true, message: 'Topping deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllToppings, getToppingById, createTopping, updateTopping, deleteTopping };