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
const routerLogout = require('./routes/logout');
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
app.use('/logout', routerLogout);


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



app.get('/', checkAuthentication, async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 36;
  const offset = (page - 1) * limit;

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&limit=${limit}&offset=${offset}&rating=g&lang=en`);
    const data = await response.json();

    const imageUrls = [];
    data.data.forEach(gif => {
      imageUrls.push(gif.images.fixed_height.url);
    });

    const userId = req.session.user.user_id;
    const favoritedGifs = await db.manyOrNone('SELECT gif_url FROM favorites INNER JOIN gifs ON favorites.gif_id = gifs.gif_id WHERE favorites.user_id = $1', userId);
    console.log(favoritedGifs);
    res.render('index', { imageUrls, favoritedGifs, user: req.session.user });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/favorite', (req, res) => {
  const gifUrl = req.body.gifUrl;
  const userId = req.session.user.user_id;

  db.task(async (t) => {
    try {
      const gif = await t.one(
        'INSERT INTO gifs (gif_url, user_id) VALUES ($1, $2) RETURNING gif_id',
        [gifUrl, userId]
      );

      const gifId = gif.gif_id;

      await t.none(
        'INSERT INTO favorites (user_id, gif_id) VALUES ($1, $2)',
        [userId, gifId]
      );

      console.log('GIF added to favorites:', gifUrl);
      res.json({ message: 'GIF added to favorites.' });
    } catch (err) {
      console.error('Error adding GIF to favorites:', err);
      res.status(500).json({ error: 'An error occurred while adding the GIF to favorites.' });
    }
  });
});



  app.post('/unfavorite', (req, res) => {
    const gifUrl = req.body.gifUrl;
    const userId = req.session.user.user_id;
  
    db.task(async (t) => {
      try {
        const gif = await t.oneOrNone(
          'SELECT gif_id FROM gifs WHERE user_id = $1 AND gif_url = $2',
          [userId, gifUrl]
        );
  
        if (gif) {
          await t.none('DELETE FROM gifs WHERE gif_id = $1', gif.gif_id);
  
          console.log('GIF removed from favorites:', gifUrl);
          res.json({ message: 'GIF removed from favorites.' });
        } else {
          console.log('GIF not found in favorites:', gifUrl);
          res.status(404).json({ error: 'GIF not found in favorites.' });
        }
      } catch (err) {
        console.error('Error removing GIF from favorites:', err);
        res.status(500).json({ error: 'An error occurred while removing the GIF from favorites.' });
      }
    });
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
