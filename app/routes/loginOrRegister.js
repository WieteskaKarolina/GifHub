const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sql = require('../db');

const path = require('path');

router.get('/', (req, res) => {
  res.render('loginOrRegister');
});

router.post('/', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).send('Invalid input data');
  }

  try {
    const [user] = await sql`SELECT * FROM uzytkownicy WHERE login = ${name}`;

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    const match = await bcrypt.compare(password, user.haslo);
    if (!match) {
      return res.status(401).send('Invalid username or password');
    }

    req.session.user = user;
    // if (user.rola==='admin')
    // {
    //   console.log("admiiin")
    //  // return res.redirect('/admin');
    // }

    return res.status(200).send(user.rola);
  } catch (error) {
    console.error('Error logging in', error);
    return res.status(500).send('Error logging in');
  }
});

// router.post('/', async (req, res) => {
//     const { login, password } = req.body;
//     if (!login || !password) {
//       return res.status(400).send('Invalid input data');
//     }
  
//     try {
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(password, saltRounds);
  
//       await sql`INSERT INTO uzytkownicy (id, login, haslo, rola) VALUES (DEFAULT, ${login}, ${hashedPassword}, 'uzytkownik')`;
  
//       const [user] = await sql`SELECT * FROM uzytkownicy WHERE login = ${login}`;
  
//       if (!user) {
//         return res.status(401).send('Invalid username or password');
//       }
  
//       const match = await bcrypt.compare(password, user.haslo);
//       if (!match) {
//         return res.status(401).send('Invalid username or password');
//       }
  
//       req.session.user = user;
  
//       return res.status(200).send('User registered successfully');
//     } catch (error) {
//       console.error('Error registering user', error);
//       return res.status(500).send('Error registering user');
//     }
//   });

module.exports = router;
