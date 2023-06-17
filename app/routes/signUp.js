const express = require('express');
const session = require('express-session');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
  res.render('signup', { errorMessage: null, passwordMismatch: false });
});

router.post('/', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || password !== confirmPassword) {
    return res.status(400).render('signup', { errorMessage: 'Invalid input data', passwordMismatch: true });
  }

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(409).render('signup', { errorMessage: 'User with the same email already exists', passwordMismatch: false });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.any('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [email, email, hashedPassword]);

    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User:', user);
    if (!user) {
      return res.status(401).render('signup', { errorMessage: 'Invalid email or password', passwordMismatch: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).render('signup', { errorMessage: 'Invalid username or password', passwordMismatch: false });
    }

    req.session.user = user;

    res.redirect('/');
  } catch (error) {
    console.error('Error registering user', error);
    return res.status(500).render('signup', { errorMessage: 'Error registering user', passwordMismatch: false });
  }
});

module.exports = router;
