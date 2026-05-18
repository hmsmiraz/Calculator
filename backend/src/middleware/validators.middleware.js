const { body } = require('express-validator');

/**
 * Validates that both `a` and `b` are present and are valid numbers.
 */
const twoNumbersRules = [
  body('a')
    .notEmpty().withMessage('Field "a" is required')
    .isNumeric().withMessage('Field "a" must be a number'),
  body('b')
    .notEmpty().withMessage('Field "b" is required')
    .isNumeric().withMessage('Field "b" must be a number'),
];

/**
 * Validates that `operator` is one of the four supported symbols.
 */
const operatorRule = body('operator')
  .notEmpty().withMessage('Field "operator" is required')
  .isIn(['+', '-', '*', '/']).withMessage('Operator must be one of: +, -, *, /');

module.exports = {
  validateTwoNumbers: twoNumbersRules,
  validateCalculate: [...twoNumbersRules, operatorRule],
};
