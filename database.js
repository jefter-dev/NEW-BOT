const { Sequelize } = require("sequelize");
const sequelize = require("./db");

const getCandlesNoShort = async () => {
    const sql = `SELECT * FROM new_candles
                    WHERE status = true
                ORDER BY time;`;

    try {
        return await sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT })
    } catch (error) {
        console.log("ERROR [getCandlesNoShort]: ", error);
    }

    return false;
}

module.exports = {
    getCandlesNoShort,
}