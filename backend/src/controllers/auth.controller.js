const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');

// ── Helper ─────────────────────────────────────────────────────────────────────

const validationFailed = (res, errors) =>
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });

// ── Register ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password }
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await UserModel.create({ name, email, password });
    const token = generateToken({ id: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const match = await UserModel.comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({ id: user.id, email: user.email });

    // Never send password hash to client
    const { password: _pw, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: { user: safeUser, token },
    });
  } catch (err) {
    next(err);
  }
};

// ── Me ─────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/auth/me   (protected)
 * Returns the currently authenticated user.
 */
const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, getMe };
