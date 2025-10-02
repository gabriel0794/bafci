require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bafci',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 6969, // Using port from .env or default to 6969
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'bafci_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 6969, // Using port from .env or default to 6969
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bafci',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 6969, // Using port from .env or default to 6969
    dialect: 'postgres'
  }
};
