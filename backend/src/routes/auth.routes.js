const express = require('express');
const router  = express.Router();

const { register, login, getMe } = require('../controllers/auth.controller');
const { protect }                 = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validators.middleware');

// Public
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);

// Protected
router.get('/me', protect, getMe);

module.exports = router;
