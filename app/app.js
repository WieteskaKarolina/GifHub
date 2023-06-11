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
    const limit = req.query.limit || 36;
    const offset = (page - 1) * limit;
  
    fetch(`https://api.giphy.com/v1/gifs/trending?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&limit=${limit}&offset=${offset}&rating=g&lang=en`)
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


app.get('/user', checkAuthentication, (req, res) => {
  const userId = req.session.user.user_id;

  // db.any('SELECT favorites.favorite_id, gifs.gif_url FROM favorites INNER JOIN gifs ON favorites.gif_id = gifs.gif_id WHERE favorites.user_id = $1', [userId])
  //   .then(favorites => {
  //     res.render('user', { favorites, username: req.session.user.username });
  //   })
  //   .catch(error => {
  //     console.log('Error:', error);
  //     res.status(500).send('Internal Server Error');
  //   });

  const limit = 12;
  const offset = 0;

  fetch(`https://api.giphy.com/v1/gifs/trending?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&limit=${limit}&offset=${offset}&rating=g&lang=en`)
    .then(response => response.json())
    .then(data => {
      const imageUrls = [];

      data.data.forEach(gif => {
        imageUrls.push(gif.images.fixed_height.url);
      });
      res.render('user', { imageUrls , username: req.session.user.username});
    })
    .catch(error => {
      console.log('Error:', error);
      res.status(500).send('Internal Server Error');
    });

});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
