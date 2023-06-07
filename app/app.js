const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const pgp = require('pg-promise')();
const db = require('./db');
const fetch = require('isomorphic-fetch');
const path = require('path');
const loginOrRegisterRoute = require(__dirname + '/routes/loginOrRegister');
const signUpRoute = require(__dirname + '/routes/signUp');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use('/loginOrRegister', loginOrRegisterRoute);
app.use('/signUp', signUpRoute);


app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: false
}));

const checkAuthentication = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    // Redirect or render login page
    res.redirect('/loginOrRegister');
  }
};



app.get('/', checkAuthentication, (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 25;
    const offset = (page - 1) * limit;
  
    fetch(`https://api.giphy.com/v1/gifs/search?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&q=tiger&limit=${limit}&offset=${offset}&rating=g&lang=en`)
      .then(response => response.json())
      .then(data => {
        const imageUrls = [];
  
        data.data.forEach(gif => {
          imageUrls.push(gif.images.fixed_height.url);
        });
  
        res.render('index', { imageUrls , user: req.session.user});
      })
      .catch(error => {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  

app.post('/favorite', (req, res) => {
  const gifUrl = req.body.gifUrl;

  // Dodaj kod obsługujący dodanie gif-a do ulubionych w bazie danych

  res.json({ message: 'Gif dodany do ulubionych' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
