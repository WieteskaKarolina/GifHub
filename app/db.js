const pgp = require('pg-promise')();
const db = pgp('postgres://postgres:postgrespw@localhost:5432/mydatabase');

module.exports = db;