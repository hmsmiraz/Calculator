const express = require('express');
const router  = express.Router();

const {
  calculateHandler,
  getHistory,
  clearHistory,
  deleteHistoryEntry,
} = require('../controllers/calculator.controller');

const { protect }          = require('../middleware/auth.middleware');
const { validateCalculate } = require('../middleware/validators.middleware');

// All calculator routes are protected — user must be logged in
router.use(protect);

router.post('/calculate',     validateCalculate, calculateHandler);
router.get('/history',        getHistory);
router.delete('/history',     clearHistory);
router.delete('/history/:id', deleteHistoryEntry);

module.exports = router;
