const express = require('express')
const app = express()
const port = 3000
const pgp = require('pg-promise')();
const db = require('./db');
const fetch = require('isomorphic-fetch');


db.connect()
  .then((obj) => {
    console.log('Connection to the database successful!');
    obj.done(); 
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  })
  .finally(() => {
    pgp.end(); 
});


app.get('/', (req, res) => {
  fetch('https://api.giphy.com/v1/gifs/search?api_key=2HwtozSNXN1n7iOTOxjiOPC7drs5HadF&q=tiger&limit=25&offset=0&rating=g&lang=en')
    .then(response => response.json())
    .then(data => {
      const imageUrls = [];

      data.data.forEach(gif => {
        imageUrls.push(gif.images.fixed_height.url);
      });

      const html = imageUrls.map(url => `<img src="${url}" />`).join('');

      res.send(html);
    })
    .catch(error => {
      console.log('Error:', error);
      res.status(500).send('Internal Server Error');
    });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})