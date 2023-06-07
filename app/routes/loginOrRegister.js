const express = require('express');
const session = require('express-session');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
  res.render('login');
});

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Invalid input data');
  }

  try {
    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    console.log('User:', user);
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send('Invalid email or password');
    }

    req.session.user = user;

    res.redirect('/');
  } catch (error) {
    console.error('Error logging in', error);
    return res.status(500).send('Error logging in');
  }
});

module.exports = router;
