/**
 * Pure calculation utility functions.
 * All functions return { result, expression } or throw an Error.
 */

const add = (a, b) => ({
  result: a + b,
  expression: `${a} + ${b} = ${a + b}`,
});

const subtract = (a, b) => ({
  result: a - b,
  expression: `${a} - ${b} = ${a - b}`,
});

const multiply = (a, b) => ({
  result: a * b,
  expression: `${a} × ${b} = ${a * b}`,
});

const divide = (a, b) => {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  const result = a / b;
  return {
    result,
    expression: `${a} ÷ ${b} = ${result}`,
  };
};

/**
 * Dispatch to the right function based on operator string.
 * Supported operators: +  -  *  /
 */
const calculate = (a, b, operator) => {
  switch (operator) {
    case '+': return add(a, b);
    case '-': return subtract(a, b);
    case '*': return multiply(a, b);
    case '/': return divide(a, b);
    default:
      throw new Error(`Unsupported operator "${operator}". Use +, -, *, or /`);
  }
};

module.exports = { add, subtract, multiply, divide, calculate };
