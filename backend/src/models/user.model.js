const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
  /**
   * Create a new user. Hashes password before saving.
   */
  async create({ name, email, password }) {
    const hashed = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashed]
    );
    return rows[0];
  },

  /**
   * Find user by email. Returns full row including password hash.
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find user by id. Never returns password.
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Compare plain password against stored hash.
   */
  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
