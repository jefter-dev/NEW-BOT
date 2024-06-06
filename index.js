const WebSocket = require('ws');
const { getCandlesNoShort } = require('./database.js');
const { getTopChangePairs } = require('./dataBinance.js');
const { candleToCloseTime } = require('./utils.js');
const { bot } = require('./bot.js');

const INTERVAL = "5m";
const blackList = [];

const getPairsAnalize = async () => {
    const candles = await getCandlesNoShort();
    // console.log("CANDLES: ", candles); // DEBUG

    const pairOpens = candles.filter(candle => !blackList.includes(candle.symbol)).map(candle => candle.symbol);

    // const pairsChangeResult = await getTopVolumePairs24h();

    const pairsChangeResult = await getTopChangePairs();
    // const pairsChangeResult = await getTopLowPairs();
    let pairsChange = pairsChangeResult.filter(pair => !blackList.includes(pair.symbol)).map(pair => pair.symbol);
    pairsChange = pairsChange.slice(0, 50);

    let pairsAnalize = pairOpens.concat(pairsChange.filter(pair => !pairOpens.includes(pair)));
    pairsAnalize = pairsAnalize.map(function (pair) {
        return pair.toLowerCase();
    });

    return pairsAnalize;
}

let listLastCandleCloseTime = {};

const initUpdateWebsockets = async () => {
    // Lista de pares de criptomoedas que você quer monitorar
    let cryptoPairs = await getPairsAnalize();
    // let cryptoPairs = ['chzusdt'];

    // console.log("cryptoPairs: ", cryptoPairs); // DEBUG
    console.log(`***** ANALIZING ${cryptoPairs.length} PAIRS *****`, cryptoPairs);

    // Formata os pares de criptomoedas para incluir o prefixo e une-os com o delimitador '/'
    const formattedPairs = cryptoPairs.map(pair => `${pair}@kline_${INTERVAL}`).join('/');

    // Gera a URL completa do WebSocket
    const websocketURL = `wss://fstream.binance.com/ws/${formattedPairs}`;
    // console.log("websocketURL: ", websocketURL); // DEBUG

    // Inicializa o WebSocket da Binance
    let ws = new WebSocket(websocketURL);

    // Evento de conexão aberta
    ws.on('open', () => {
        console.log('Conexão estabelecida. Aguardando atualizações de velas...');
    });

    let pairsReadCount = 0;

    // Evento de mensagem recebida
    ws.on('message', async (data) => {
        const candle = JSON.parse(data);
        const currentCandleCloseTime = candle.k.T; // Obtém o timestamp de fechamento da vela atual
        const symbolCandle = candle.k.s; // Symbom do candle

        console.log(`SYMBOL: ${candle.s}`, candleToCloseTime(candle.k.T));

        // Adiciona currentCandleCloseTime para verificação se passou-se o process.env.INTERVAL
        if (currentCandleCloseTime !== listLastCandleCloseTime[symbolCandle.toLowerCase()]) {
            listLastCandleCloseTime[symbolCandle.toLowerCase()] = currentCandleCloseTime

            // Se o timestamp da vela atual for diferente do anterior, significa que uma nova vela de 5 minutos foi fechada
            console.log(`NEW CANDLE [${symbolCandle}]`);

            // const candleDataCurrent = {
            //     time: new Date(candle.k.T),
            //     open: parseFloat(candle.k.o),
            //     high: parseFloat(candle.k.h),
            //     low: parseFloat(candle.k.l),
            //     close: parseFloat(candle.k.c),
            //     volume: parseFloat(candle.k.v),
            // }

            // console.log(`CANDLE DATA [${symbolCandle}]: `, candleDataCurrent);
            bot(symbolCandle); // MAGIC

            // console.log("CONT: ", pairsReadCount, cryptoPairs.length); // DEBUG
            pairsReadCount++;
            if (pairsReadCount === cryptoPairs.length) {
                // Todos os pares foram lidos, então atualize os pares
                updateCryptoPairs();
            }
        }
    });

    // Método para atualizar os pares de criptomoedas sendo monitorados
    const updateCryptoPairs = async () => {
        const pairsAnalize = await getPairsAnalize();

        // DEBUG
        // console.log("ATUALIZAR SYMBOLS WEBSOCKETS: ", pairsAnalize);
        // console.log("cryptoPairs: ", cryptoPairs);

        // Adiciona novos pares da lista mestra que não estão na lista atual
        const pairsToAdd = pairsAnalize.filter(pair => !cryptoPairs.includes(pair));
        // console.log("pairsToAdd: ", pairsToAdd); // DEBUG

        cryptoPairs.push(...pairsToAdd);

        // Remove pares da lista atual que não estão na lista mestra
        cryptoPairs = cryptoPairs.filter(pair => pairsAnalize.includes(pair));
        // console.log("PAIRS ATUALIZADOS: ", cryptoPairs); // DEBUG

        // Reabre a conexão WebSocket com os pares atualizados
        ws.close();

        return false;
    };

    // Evento de erro
    ws.on('error', (error) => {
        console.error('Ocorreu um erro [Stream binance]:', error);
    });

    ws.on('close', () => {
        console.log("FECHOU A CONEXÃO [BINANCE]");

        initUpdateWebsockets();
    });

    return false;
}

initUpdateWebsockets();