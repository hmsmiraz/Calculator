const pool = require('../config/db');

const CalculationModel = {
  /**
   * Save a calculation result for a user.
   */
  async create({ userId, operandA, operandB, operator, result, expression, operation }) {
    const { rows } = await pool.query(
      `INSERT INTO calculations
         (user_id, operand_a, operand_b, operator, result, expression, operation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, operandA, operandB, operator, result, expression, operation]
    );
    return rows[0];
  },

  /**
   * Get all calculations for a user, newest first.
   * Supports optional pagination via limit + offset.
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM calculations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  },

  /**
   * Count total calculations for a user (used for pagination).
   */
  async countByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS total FROM calculations WHERE user_id = $1',
      [userId]
    );
    return parseInt(rows[0].total, 10);
  },

  /**
   * Delete all calculations for a user.
   */
  async deleteAllByUserId(userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM calculations WHERE user_id = $1',
      [userId]
    );
    return rowCount;
  },

  /**
   * Delete a single calculation (only if it belongs to the user).
   */
  async deleteOne(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM calculations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },
};

module.exports = CalculationModel;
