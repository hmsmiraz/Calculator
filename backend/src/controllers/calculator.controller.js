const { validationResult } = require('express-validator');
const { add, subtract, multiply, divide, calculate } = require('../utils/calculator.utils');

/**
 * Shared response builder
 */
const buildResponse = ({ result, expression, operation }) => ({
  success: true,
  data: {
    result,
    expression,
    operation,
    timestamp: new Date().toISOString(),
  },
});

/**
 * POST /api/v1/calculator/calculate
 * Body: { a: number, b: number, operator: '+' | '-' | '*' | '/' }
 */
const calculateHandler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { a, b, operator } = req.body;
    const operationNames = { '+': 'addition', '-': 'subtraction', '*': 'multiplication', '/': 'division' };
    const { result, expression } = calculate(Number(a), Number(b), operator);

    return res.status(200).json(
      buildResponse({ result, expression, operation: operationNames[operator] })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/calculator/add
 * Body: { a: number, b: number }
 */
const addHandler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { a, b } = req.body;
    const { result, expression } = add(Number(a), Number(b));

    return res.status(200).json(buildResponse({ result, expression, operation: 'addition' }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/calculator/subtract
 * Body: { a: number, b: number }
 */
const subtractHandler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { a, b } = req.body;
    const { result, expression } = subtract(Number(a), Number(b));

    return res.status(200).json(buildResponse({ result, expression, operation: 'subtraction' }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/calculator/multiply
 * Body: { a: number, b: number }
 */
const multiplyHandler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { a, b } = req.body;
    const { result, expression } = multiply(Number(a), Number(b));

    return res.status(200).json(buildResponse({ result, expression, operation: 'multiplication' }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/calculator/divide
 * Body: { a: number, b: number }
 */
const divideHandler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { a, b } = req.body;
    const { result, expression } = divide(Number(a), Number(b));

    return res.status(200).json(buildResponse({ result, expression, operation: 'division' }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/calculator/operations
 * Returns list of supported operations
 */
const getOperations = (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      operations: [
        { name: 'addition',       operator: '+', endpoint: '/api/v1/calculator/add'      },
        { name: 'subtraction',    operator: '-', endpoint: '/api/v1/calculator/subtract' },
        { name: 'multiplication', operator: '*', endpoint: '/api/v1/calculator/multiply' },
        { name: 'division',       operator: '/', endpoint: '/api/v1/calculator/divide'   },
      ],
      unified_endpoint: {
        endpoint: '/api/v1/calculator/calculate',
        operators: ['+', '-', '*', '/'],
      },
    },
  });
};

module.exports = {
  calculateHandler,
  addHandler,
  subtractHandler,
  multiplyHandler,
  divideHandler,
  getOperations,
};
