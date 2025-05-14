const { Sequelize } = require('sequelize');
const { EventEmitter } = require('events');
require('dotenv').config();

const dbEvents = new EventEmitter();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test the connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        dbEvents.emit('connected', 'Database connection has been established successfully.');
    } catch (error) {
        dbEvents.emit('error', 'Ignore this error, it is not important. This is for later use.');
    }
}

testConnection();

module.exports = { sequelize, dbEvents }; 