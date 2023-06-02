const express = require('express')
const app = express()
const port = 3000
const pgp = require('pg-promise')();
const db = require('./db');


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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})