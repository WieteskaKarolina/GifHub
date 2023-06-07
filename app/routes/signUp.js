const express = require('express');
const session = require('express-session');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
  res.render('signup');
});

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Invalid input data');
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.any(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [email, email, hashedPassword]
    );

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
      return res.status(401).send('Invalid username or password');
    }

    req.session.user = user;

    res.redirect('/');
  } catch (error) {
    console.error('Error registering user', error);
    return res.status(500).send('Error registering user');
  }
});

module.exports = router;
