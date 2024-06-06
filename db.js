const Sequilize = require("sequelize");

const sequelize = new Sequilize('my_app', 'root', '', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3307,
    logging: false 
    // dialectOptions: { "useUTC": false, "dateFirst": 1 },
    // timezone: "-03:00"
});

module.exports = sequelize;