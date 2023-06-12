const pgp = require('pg-promise')();
// const db = pgp('postgres://postgres:postgrespw@localhost:5432/mydatabase');

const db = pgp('postgres://postgres:postgrespw@db:5432/mydatabase');
module.exports = db;