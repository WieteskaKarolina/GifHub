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
const axios = require('axios');

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
    res.redirect('/loginOrRegister');
  }
};

let imageUrls = []; 

app.get('/', checkAuthentication, async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 36;
  const offset = (page - 1) * limit;

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&limit=${limit}&offset=${offset}&rating=g&lang=en`);
    const data = await response.json();
    imageUrls = []
    data.data.forEach(gif => {
      imageUrls.push(gif.images.fixed_height.url);
    });

    const userId = req.session.user.user_id;
    const favoritedGifs = await db.manyOrNone('SELECT gif_url FROM favorites INNER JOIN gifs ON favorites.gif_id = gifs.gif_id WHERE favorites.user_id = $1', userId);
    res.render('index', { imageUrls, favoritedGifs, user: req.session.user });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/search', checkAuthentication, async (req, res) => {
  const query = req.query.q;
  const page = req.query.page || 1;
  const limit = req.query.limit || 36;
  const offset = (page - 1) * limit;

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&q=${query}&limit=${limit}&offset=${offset}&rating=g&lang=en`);
    const data = await response.json();
    const imageUrls = data.data.map(gif => gif.images.fixed_height.url);

    const userId = req.session.user.user_id;
    const favoritedGifs = await db.manyOrNone('SELECT gif_url FROM favorites INNER JOIN gifs ON favorites.gif_id = gifs.gif_id WHERE favorites.user_id = $1', userId);

    const tagsResponse = await fetch(`https://api.giphy.com/v1/tags/related/${query}?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF`);
    const tagsData = await tagsResponse.json();
    const tags = tagsData.data.map(tag => tag.name);

    const recommendations = [...tags, query];

    for (const tag of recommendations) {
      const existingTag = await db.oneOrNone('SELECT tag_id FROM tags WHERE tag_name = $1', tag);

      if (existingTag) {
        await db.none('INSERT INTO recommendations_by_searching (user_id, tag_id) VALUES ($1, $2)', [userId, existingTag.tag_id]);
      } else {
        const newTag = await db.one('INSERT INTO tags (tag_name) VALUES ($1) RETURNING tag_id', tag);
        await db.none('INSERT INTO recommendations_by_searching (user_id, tag_id) VALUES ($1, $2)', [userId, newTag.tag_id]);
      }
    }

    res.render('index', { imageUrls, favoritedGifs, user: req.session.user });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/gif', checkAuthentication,  async (req, res) => {
  const gifUrl = req.query.url;

  try {
    const gifResponse = await fetch(`https://api.giphy.com/v1/gifs/translate?api_key=LTseqPTtX3lsCg7ZBGXDISq76fMIGVHJ&s=${gifUrl}`);
    const gifData = await gifResponse.json();

    const title = gifData.data.title;
    const tags = title.split(' ');

    const userId = req.session.user.user_id;
    const favoritedGif = await db.oneOrNone(
      'SELECT gif_url FROM favorites ' +
      'INNER JOIN gifs ON favorites.gif_id = gifs.gif_id ' +
      'WHERE favorites.user_id = $1 AND gifs.gif_url = $2',
      [userId, gifUrl]
    );

    const isFavorited = favoritedGif !== null;

    res.render('gif', { gifUrl, tags, isFavorited, prevUrl: '/prev', nextUrl: '/next' });
  } catch (error) {
    console.error('Error fetching GIF details:', error);
    res.status(500).send('Error fetching GIF details');
  }
});

app.get('/prev',  (req, res) => {
  const gifUrl = decodeURIComponent(req.query.url); 
  const currentIndex = imageUrls.findIndex(url => url === gifUrl);
  const prevIndex = currentIndex - 1;
 
  if (prevIndex >= 0 && prevIndex < imageUrls.length) {
    const prevUrl = imageUrls[prevIndex];
    res.redirect(`/gif?url=${encodeURIComponent(prevUrl)}`);
  } else {
    res.redirect(`/gif?url=${encodeURIComponent(gifUrl)}`);
  }
});

app.get('/next',  (req, res) => {
  const gifUrl = decodeURIComponent(req.query.url);  
  console.log("url:", gifUrl)
  console.log(imageUrls)
  const currentIndex = imageUrls.findIndex(url => url === gifUrl);
  const nextIndex = currentIndex + 1;
  console.log(currentIndex)

  if (nextIndex >= 0 && nextIndex < imageUrls.length) {
    const nextUrl = imageUrls[nextIndex];
    res.redirect(`/gif?url=${encodeURIComponent(nextUrl)}`);
  } else {
    res.redirect(`/gif?url=${encodeURIComponent(gifUrl)}`);
  }
});




app.post('/favorite', async (req, res) => {
  const gifUrl = req.body.gifUrl;
  const userId = req.session.user.user_id;

  try {
    const gif = await db.one(
      'INSERT INTO gifs (gif_url, user_id) VALUES ($1, $2) RETURNING gif_id',
      [gifUrl, userId]
    );

    const gifId = gif.gif_id;

    await db.none(
      'INSERT INTO favorites (user_id, gif_id) VALUES ($1, $2)',
      [userId, gifId]
    );

    console.log('GIF added to favorites:', gifUrl);

    const gifResponse = await fetch(`https://api.giphy.com/v1/gifs/translate?api_key=LTseqPTtX3lsCg7ZBGXDISq76fMIGVHJ&s=${gifUrl}`);
    const gifData = await gifResponse.json();
    const title = gifData.data.title;
    const tags = title.split(' ');

    for (const tag of tags) {
      const existingTag = await db.oneOrNone('SELECT tag_id FROM tags WHERE tag_name = $1', tag);

      if (existingTag) {
        await db.none('INSERT INTO gif_tags (gif_id, tag_id) VALUES ($1, $2)', [gifId, existingTag.tag_id]);
      } else {
        const newTag = await db.one('INSERT INTO tags (tag_name) VALUES ($1) RETURNING tag_id', tag);
        await db.none('INSERT INTO gif_tags (gif_id, tag_id) VALUES ($1, $2)', [gifId, newTag.tag_id]);
      }
    }

    res.json({ message: 'GIF added to favorites.' });
  } catch (error) {
    console.error('Error adding GIF to favorites:', error);
    res.status(500).json({ error: 'An error occurred while adding the GIF to favorites.' });
  }
});


const pythonServerURL = 'http://ai:5000';

app.get('/recommendations', async (req, res) => {
  const userId = req.session.user.user_id;

  try {
    const recommendationResponse = await axios.get(`${pythonServerURL}/recommendations`, {
      params: { user_id: userId },
    });

    const recommendations = recommendationResponse.data.image_urls;
    const favoritedGifs = await db.manyOrNone('SELECT gif_url FROM favorites INNER JOIN gifs ON favorites.gif_id = gifs.gif_id WHERE favorites.user_id = $1', userId);
    res.render('recommendations', { recommendations , favoritedGifs, user: req.session.user });
  } catch (error) {
    console.error('Błąd podczas pobierania rekomendacji GIF-ów:', error);
    res.status(500).send('Wystąpił błąd podczas pobierania rekomendacji GIF-ów.');
  }
});


app.post('/unfavorite',  async (req, res) => {
  const gifUrl = req.body.gifUrl;
  const userId = req.session.user.user_id;

  try {
    const gif = await db.oneOrNone(
      'SELECT gif_id FROM gifs WHERE user_id = $1 AND gif_url = $2',
      [userId, gifUrl]
    );

    if (gif) {
      await db.none('DELETE FROM favorites WHERE gif_id = $1', gif.gif_id);
      await db.none('DELETE FROM gif_tags WHERE gif_id = $1', gif.gif_id);
      
      console.log('GIF removed from favorites:', gifUrl);
      res.json({ message: 'GIF removed from favorites.' });
    } else {
      console.log('GIF not found in favorites:', gifUrl);
      res.status(404).json({ error: 'GIF not found in favorites.' });
    }
  } catch (error) {
    console.error('Error removing GIF from favorites:', error);
    res.status(500).json({ error: 'An error occurred while removing the GIF from favorites.' });
  }
});
  


app.get('/user', checkAuthentication, async (req, res) => {
    const userId = req.session.user.user_id;
  
    try {
      const favorites = await db.any(
        'SELECT favorites.favorite_id, gifs.gif_url ' +
        'FROM favorites ' +
        'INNER JOIN gifs ON favorites.gif_id = gifs.gif_id ' +
        'WHERE favorites.user_id = $1',
        userId
      );
  
      res.render('user', { favorites, username: req.session.user.username });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
