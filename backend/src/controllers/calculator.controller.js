const { validationResult } = require('express-validator');
const { calculate } = require('../utils/calculator.utils');
const CalculationModel = require('../models/calculation.model');

const validationFailed = (res, errors) =>
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });

// ── Calculate ──────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/calculator/calculate   (protected)
 * Body: { a, b, operator }
 * Performs calculation and saves it to the user's history.
 */
const calculateHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const { a, b, operator } = req.body;
    const numA = Number(a);
    const numB = Number(b);

    const { result, expression, operation } = calculate(numA, numB, operator);

    // Save to DB
    const saved = await CalculationModel.create({
      userId:     req.user.id,
      operandA:   numA,
      operandB:   numB,
      operator,
      result,
      expression,
      operation,
    });

    return res.status(200).json({
      success: true,
      data: {
        id:         saved.id,
        result,
        expression,
        operation,
        timestamp:  saved.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── History ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/calculator/history   (protected)
 * Returns paginated calculation history for the logged-in user.
 * Query params: ?page=1&limit=20
 */
const getHistory = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit  = Math.min(50, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      CalculationModel.findByUserId(req.user.id, { limit, offset }),
      CalculationModel.countByUserId(req.user.id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        calculations: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Clear history ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/calculator/history   (protected)
 * Deletes all history for the logged-in user.
 */
const clearHistory = async (req, res, next) => {
  try {
    const deleted = await CalculationModel.deleteAllByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      message: `${deleted} calculation(s) deleted.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/calculator/history/:id   (protected)
 * Deletes a single history entry (must belong to logged-in user).
 */
const deleteHistoryEntry = async (req, res, next) => {
  try {
    const deleted = await CalculationModel.deleteOne(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }
    return res.status(200).json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { calculateHandler, getHistory, clearHistory, deleteHistoryEntry };
