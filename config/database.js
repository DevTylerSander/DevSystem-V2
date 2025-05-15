const { Sequelize } = require('sequelize');
const { EventEmitter } = require('events');
require('dotenv').config();

const dbEvents = new EventEmitter();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// Test the connection
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        dbEvents.emit('connected', 'Database connection has been established successfully.');
    } catch (error) {
        dbEvents.emit('error', 'Unable to connect to the database:', error);
    }
}

initializeDatabase();

module.exports = { sequelize, dbEvents }; 