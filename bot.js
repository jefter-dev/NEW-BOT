const Candle = require("./candle");
const { getHistoryCandlesFutures, getAmountInvest, newFuturesOrder, setLeverage, getOpenPositions, getBalanceFuturesUsdt } = require("./dataBinance");
const { calculateMACD } = require("./movingAverageConvergenceDivergenceIndicator");
const { calculateRSI } = require("./relativeStrengthIndex");
const { calculateSMAPeriods } = require("./sma");
const { calculateSqueezeMomentum } = require("./squeezeMomentumIndicator");
const { calculateStopAtr } = require("./stopAtrHighLowLinesIndicator");

const Binance = require('node-binance-api');
const { color, log, red, green, cyan, blue, blueBright, bgBlueBright, cyanBright, greenBright, bgGreen, redBright } = require('console-log-colors');

const AMOUNT = 6;
const LEVERAGE = 3;
const INTERVAL = "5m";
const API_KEY_BINANCE = 'QYqItSAbZ3LoUnU9gbt7tYz8Fs4CrdNN4wjklRGmnr8yC0yj1itlbpfidTjwxlfV';
const SECRET_KEY_BINANCE = 'c4V3UXAvvs6mrtzXvJQdKi1i9ezbe6Y3lxne5nkfQ6AoDCPbJwfJCtwkuXch4kkb';
const PRODUCTION = true;

const binance = new Binance().options({
    APIKEY: API_KEY_BINANCE,
    APISECRET: SECRET_KEY_BINANCE,
    family: 4,
    useServerTime: true
});

function calculateRSICrossover(data) {
    for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];

        // Verificar cruzamento de RSI para RSI Long
        if (parseFloat(current.rsi) > parseFloat(current.rsiLong) &&
            parseFloat(previous.rsi) <= parseFloat(previous.rsiLong)) {
            current.positionRsi = 'long'; // Indicativo de "long"
            current.signalRsi = true; // Indicativo de "long"
        } else if (parseFloat(current.rsi) < parseFloat(current.rsiLong) &&
            parseFloat(previous.rsi) >= parseFloat(previous.rsiLong)) {
            current.positionRsi = 'short'; // Indicativo de "short"
            current.signalRsi = true; // Indicativo de "long"
        } else {
            current.positionRsi = null; // Sem cruzamento
            current.signalRsi = false; // Indicativo de "long"
        }

        data[i] = current;
    }

    return data;
}

const addCandle = async (symbol, candle) => {
    candle.symbol = symbol;
    const dataUTC = new Date(candle.time).toISOString().slice(0, 19).replace('T', ' ');
    candle.time = dataUTC;

    try {
        const newCandle = await Candle.create(candle)
        // console.log(newCandle); // DEBUG

        return newCandle;
    } catch (error) {
        console.log("ERROR ADD: ", error); // DEBUG        
    }

    return false;
}

async function updateCandleById(id, newData) {
    console.log("updateCandleById: ", id, newData);

    try {
        // Encontrar o usuário pelo ID
        const candle = await Candle.findByPk(id);
        if (candle) {
            // Atualizar os dados do usuário com os novos dados
            await candle.update(newData);
        } else {
        }
    } catch (error) {
        console.error('Error updated CANDLE:', error);
    }
}

const getLastCandle = async (symbol) => {
    try {
        return await Candle.findOne({
            where: { symbol },
            order: [
                ['id', 'DESC']
            ]
        })
    } catch (error) {
        // console.log("ERROR [getOpensCandles]: ", error);

        return error;
    }
}

const getCandlesStrategy = async (symbol) => {
    const candles = await getHistoryCandlesFutures(symbol, INTERVAL);
    const AP2 = 10; // ATR Period
    const AF2 = 2; // ATR Factor
    candlesResult = await calculateStopAtr(candles, AP2, AF2);
    candlesResult = await calculateRSI(candlesResult, 25);
    candlesResult = await calculateRSI(candlesResult, 100, "long");

    return await calculateRSICrossover(candlesResult);
}

const bot = async (symbol) => {
    let inPosition = false;
    let signal = null;

    const strategyResult = await getCandlesStrategy(symbol);
    // console.log("RESULT [CANDLES]: ", strategyResult.slice(strategyResult.length - 40, strategyResult.length - 1));

    if (strategyResult.length == 0) return false

    const finalCandle = strategyResult[strategyResult.length - 2];

    console.log(`#Candle [new bot] ${cyan(symbol)}: `, finalCandle.time, inPosition);
    // console.log(`FINAL CANDLE ${symbol}: `, finalCandle);

    // Verifica se tem alguma posição em aberto para o symbol
    const candle = await getLastCandle(symbol);
    // console.log("CANDLE: ", candle); // DEBUG

    if (candle != null) {
        inPosition = candle.status;
        signal = candle
    }

    if (((finalCandle.positionRsi == "long" && finalCandle.signalBuyAtr) ||
        (finalCandle.positionRsi == "short" && !finalCandle.signalBuyAtr)) &&
        !inPosition) {

        const balanceUsdt = await getBalanceFuturesUsdt();

        if (balanceUsdt.availableBalance >= AMOUNT) {
            console.log("TRY BUY: ", symbol, AMOUNT); // DEBUG

            let dataBuy = null;

            if (PRODUCTION) {
                console.log("PRODUCTION BUY:", symbol);
                await setLeverage(symbol, LEVERAGE);

                const amount = await getAmountInvest(symbol, AMOUNT);
                console.log("AMOUNT INVEST: ", amount);

                const side = finalCandle.positionRsi == "long" ? "BUY" : "SELL";
                const dataBuy = await newFuturesOrder(symbol, amount, side, "MARKET");

                console.log(`RESULT OPENED [newFuturesOrder][${side}]: `, dataBuy);
            } else {
                // FIXME: - TESTING - SANDBOX
                dataBuy = true;
            }
            // console.log("DATA BUY: ", dataBuy); // DEBUG

            finalCandle.status = true;
            finalCandle.entryPrice = finalCandle.close;

            await addCandle(symbol, finalCandle);
        }
    } else { // SELL
        console.log("SIGNAL [SELL]: ", signal);

        if (signal == null) return false

        const nextSignal = finalCandle;
        // console.log("CANDLE SELL: ", nextSignal);

        // const diffHours = getDiffTime(signal.time, finalCandle.time);
        // console.log(signal.symbol, ": ", parseInt(diffHours), " > ", parseInt(process.env.MAX_HOURS_TRADE))

        let closedSignal = false;

        // console.log("signal.positionRsi: ", signal.positionRsi, nextSignal.signalBuyAtr, inPosition);
        // if (signal.positionRsi == "long" && !nextSignal.signalBuyAtr) {
        //     closedSignal = true;
        // } else if (signal.positionRsi == "short" && nextSignal.signalBuyAtr) {
        //     closedSignal = true;
        // }

        // PROFIT
        stopLossPrice = candle.entryPrice * 1.01; // 1% de stop loss
        closedSignal = nextSignal.close >= stopLossPrice ? true : closedSignal;

        // STOPLOSS
        if (!closedSignal) {
            stopLossPrice = candle.entryPrice * 0.99; // 1% de stop loss
            closedSignal = nextSignal.close <= stopLossPrice ? true : closedSignal;
        }

        // console.log("closedSignal: ", closedSignal, inPosition); // DEBUG

        if (closedSignal && inPosition) {
            // const amountSell = await getAmountBalanceSell(symbol);
            const amountSell = 0;

            console.log("TRY SELL: ", symbol, amountSell);
            // console.log("DATA SELL: ", dataSell); // DEBUG

            // FIXME: - TESTING - SANDBOX
            let dataSell = null;

            if (PRODUCTION) {
                console.log("PRODUCTION SELL");

                const trades = await getOpenPositions([symbol]);
                if (trades.length != 0) {
                    const amountClosed = Math.abs(trades[0].positionAmt);

                    console.log("amountClosed: ", amountClosed);

                    const side = signal.positionRsi == "long" ? "SELL" : "BUY";

                    const dataSell = await newFuturesOrder(symbol, amountClosed, side, "MARKET");
                    console.log(`RESULT CLOSED [newFuturesOrder][${side}]: `, dataSell);
                }
            } else {
                dataSell = true;
            }

            console.log(`SELL ${symbol}: `, amountSell);

            finalCandle.status = false;
            finalCandle.exitPrice = finalCandle.close;
            finalCandle.timeExit = new Date(finalCandle.time).toISOString().slice(0, 19).replace('T', ' ');
            finalCandle.positionRsi = signal.positionRsi;
            finalCandle.time = signal.time;

            await updateCandleById(signal.id, finalCandle);
        }
    }

    return false;
}

module.exports = {
    bot,
}