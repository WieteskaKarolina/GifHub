const pgp = require('pg-promise')();
const db = pgp('postgres://postgres:postgrespw@localhost:32768');

module.exports = db;