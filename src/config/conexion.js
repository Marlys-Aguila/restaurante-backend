// require("dotenv").config();

// const { Pool } = require("pg");

// const pool = new Pool({
//   host: process.env.HOST,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   allowExitOnIdle: process.env.ALLOW_EXIT_ON_IDLE,
// });

// module.exports = pool;

// ------------- en vez de pool es client con elephant -------------
const client = require('./elephantsql');

module.exports = client;
