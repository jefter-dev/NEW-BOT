const Sequelize = require("sequelize");
const database = require("./db");

const Candle = database.define("new_candles", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    symbol: {
        type: Sequelize.STRING,
    },
    time: {
        type: Sequelize.DATE,
    },
    timeExit: {
        type: Sequelize.DATE,
    },
    open: {
        type: Sequelize.DOUBLE,
    },
    low: {
        type: Sequelize.DOUBLE,
    },
    close: {
        type: Sequelize.DOUBLE,
    },
    entryPrice: {
        type: Sequelize.DOUBLE,
    },
    exitPrice: {
        type: Sequelize.DOUBLE,
    },
    volume: {
        type: Sequelize.DOUBLE,
    },
    trades: {
        type: Sequelize.DOUBLE,
    },
    trailAtr: {
        type: Sequelize.DOUBLE,
    },
    signalAtr: {
        type: Sequelize.STRING,
    },
    signalColorAtr: {
        type: Sequelize.STRING,
    },
    signalBuyAtr: {
        type: Sequelize.BOOLEAN,
    },
    rsi: {
        type: Sequelize.DOUBLE,
    },
    rsiLong: {
        type: Sequelize.DOUBLE,
    },
    positionRsi: {
        type: Sequelize.STRING,
    },
    signalRsi: {
        type: Sequelize.BOOLEAN,
    },
    action: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.BOOLEAN,
    },
})

module.exports = Candle;