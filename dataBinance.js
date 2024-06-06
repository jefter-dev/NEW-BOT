const crypto = require('crypto');
const axios = require('axios');
const Binance = require('node-binance-api');

const API_KEY_BINANCE = "QYqItSAbZ3LoUnU9gbt7tYz8Fs4CrdNN4wjklRGmnr8yC0yj1itlbpfidTjwxlfV";
const SECRET_KEY_BINANCE = "c4V3UXAvvs6mrtzXvJQdKi1i9ezbe6Y3lxne5nkfQ6AoDCPbJwfJCtwkuXch4kkb";
const FUTURES_API_URL = "https://fapi.binance.com/fapi";
const MIN_PERCENT_CHANGE = 1

const binance = new Binance().options({
    APIKEY: API_KEY_BINANCE,
    APISECRET: SECRET_KEY_BINANCE,
    family: 4,
    useServerTime: true
});

// Função para obter velas
async function getKlines(symbol, interval, limit, startTime) {
    const url = 'https://fapi.binance.com/fapi/v1/klines';

    // Construa os parâmetros da consulta
    const params = {
        symbol: symbol,
        interval: interval,
        limit: limit,
        startTime: startTime,
    };

    try {
        const response = await axios.get(url, { params });

        const klines = response.data.map(candle => ({
            time: new Date(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
        }));

        return klines;
    } catch (error) {
        console.error('Erro na chamada da API:', error.message);
        throw error;
    }
}

// Função para obter todas as velas
async function getAllKlines(symbol, interval, limit, totalLimit) {
    let startTime = 0;
    let allKlines = [];

    try {
        while (allKlines.length < totalLimit) {
            const klines = await getKlines(symbol, interval, limit, startTime);

            if (klines.length === 0) {
                break; // Sai do loop se não houver mais velas
            }

            allKlines = allKlines.concat(klines);
            startTime = klines[klines.length - 1][0] + 1;
        }

        // Retorna todas as velas acumuladas
        return allKlines.slice(0, totalLimit);
    } catch (error) {
        console.error('Erro ao obter todas as velas:', error.message);
        throw error;
    }
}


// Exemplo de uso
async function getHistoryCandles30DaysFutures(symbol, interval) {
    const limit = 1500; // Número máximo de velas por chamada
    let startTime = 0; // Substitua pelo timestamp da última vela obtida

    try {
        // Loop para obter 8640 velas
        for (let i = 0; i < 6; i++) {
            const klines = await getKlinesFutures(symbol, interval, limit, startTime);
            console.log("klines: ", klines);

            // Processar as velas (faça algo com elas)

            // Atualizar o startTime para o timestamp da última vela obtida
            startTime = klines[klines.length - 1][0] + 1;
        }

        return klines;
    } catch (error) {
        // Lidar com erros
    }
}

// Função para obter velas
async function getKlinesFutures(symbol, interval, limit, startTime) {
    const url = 'https://fapi.binance.com/fapi/v1/klines';

    // Construa os parâmetros da consulta
    const params = {
        symbol: symbol,
        interval: interval,
        limit: limit,
        startTime: startTime,
    };

    try {
        const response = await axios.get(url, { params });

        // Processar a resposta da API
        const klines = response.data;
        // Faça algo com as velas (klines) aqui

        return klines;
    } catch (error) {
        console.error('Erro na chamada da API:', error.message);
        throw error;
    }
}

const getHistoryCandlesFutures = async (symbol, interval) => {
    // Configuração da solicitação
    const requestOptions = {
        method: 'get',
        url: `https://fapi.binance.com/fapi/v1/klines`,
        params: {
            symbol: symbol,
            interval: interval,
            limit: 239,
        },
        // headers: {
        //     'X-MBX-APIKEY': 'SuaChaveDeAPIAqui', // Substitua pelo seu próprio X-MBX-APIKEY
        // },
    };

    // Faz a solicitação à API REST
    try {
        const response = await axios(requestOptions);
        // console.log("response.data [CANDLES]: ", response.data); // DEBUG

        const candles = response.data.map(candle => ({
            symbol: symbol,
            time: new Date(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            trades: parseFloat(candle[8])
        }));

        // candles.sort((a, b) => b.close - a.close);

        return candles;
    } catch (error) {
        console.error('Erro na solicitação:', error.message || error);
    }

    return false;
}

const getTopVolumePairs = async () => {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
        const pairs = response.data
            .filter(pair => pair.symbol.endsWith('USDT')) // Filtrar apenas pares em relação ao USDT
            .map(pair => ({
                symbol: pair.symbol,
                volume: parseFloat(pair.volume),
            }))
            .sort((a, b) => b.volume - a.volume) // Ordenar por volume decrescente
            .slice(0, 20); // Obter os top 20 pares com maior volume

        return pairs;
    } catch (error) {
        console.error('Error fetching top volume pairs:', error.message || error);
        return [];
    }
}

const getHistoryCandlesSpot = async (symbol, interval) => {
    // Configuração da solicitação
    const requestOptions = {
        method: 'get',
        url: `https://api.binance.com/api/v3/klines`,
        params: {
            symbol: symbol,
            interval: interval,
            limit: 239,
        },
    };

    // Faz a solicitação à API REST
    try {
        const response = await axios(requestOptions)
        const candles = response.data.map(candle => ({
            time: new Date(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
        }));

        // DEBUG
        // console.log("response.data: ", response.data.slice(-1));
        // console.log("CANDLES: ", candles.slice(-1));

        return candles;
    } catch (error) {
        console.error(`Error [getHistoryCandlesSpot][${symbol}]:`, error.message || error);
    }

    return false;
}

async function getTopVolumePairs24h() {
    try {
        const baseUrl = 'https://fapi.binance.com'; // URL da Binance Futures API

        // Obter todos os pares disponíveis
        const response = await axios.get(`${baseUrl}/fapi/v1/exchangeInfo`);
        const allPairs = response.data.symbols;

        // Filtrar pares com base em critérios específicos (por exemplo, volume, popularidade) e que terminam com "USDT"
        const filteredPairs = allPairs.filter(pair => {
            return pair.status === 'TRADING' && pair.symbol.endsWith('USDT');
        });

        // Classificar os pares com base no volume em ordem decrescente
        filteredPairs.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));

        // Obter apenas os símbolos dos 20 primeiros pares filtrados
        // const symbols = filteredPairs.slice(0, 20);
        const symbols = filteredPairs.slice(0, 20);

        return symbols;
    } catch (error) {
        console.error('Erro ao obter os pares com maior volume:', error);
        throw error;
    }
}

async function getTopChangePairs() {
    const apiUrl = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

    try {
        // Faça uma solicitação GET para a API de Futuros da Binance usando axios
        const response = await axios.get(apiUrl);

        // Verifique se a solicitação foi bem-sucedida (código de resposta 200)
        if (response.status === 200) {
            // Obtenha os dados JSON da resposta
            const tickers = response.data;

            const filteredTickers = tickers.filter(ticker => {
                return ticker.symbol.endsWith('USDT') && parseFloat(ticker.priceChangePercent) > MIN_PERCENT_CHANGE;
            });
            const sortedTickers = filteredTickers.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

            // console.log("sortedTickers: ", sortedTickers); // DEBUG

            return sortedTickers;
        } else {
            // Imprima uma mensagem de erro se a solicitação não for bem-sucedida
            console.error(`Erro na solicitação: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Erro na solicitação: ${error.message}`);
        return null;
    }
}

async function getTopHighPairs() {
    const apiUrl = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

    try {
        // Faça uma solicitação GET para a API de Futuros da Binance usando axios
        const response = await axios.get(apiUrl);

        // Verifique se a solicitação foi bem-sucedida (código de resposta 200)
        if (response.status === 200) {
            // Obtenha os dados JSON da resposta
            const tickers = response.data;

            const filteredTickers = tickers.filter(ticker => {
                return ticker.symbol.endsWith('USDT') && parseFloat(ticker.highPrice) > MIN_HIGH_PRICE;
            });
            const sortedTickers = filteredTickers.sort((a, b) => parseFloat(b.highPrice) - parseFloat(a.highPrice));

            // console.log("sortedTickers: ", sortedTickers); // DEBUG

            return sortedTickers;
        } else {
            // Imprima uma mensagem de erro se a solicitação não for bem-sucedida
            console.error(`Erro na solicitação: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Erro na solicitação: ${error.message}`);
        return null;
    }
}

async function getTopLowPairs() {
    const apiUrl = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

    try {
        // Faça uma solicitação GET para a API de Futuros da Binance usando axios
        const response = await axios.get(apiUrl);

        // Verifique se a solicitação foi bem-sucedida (código de resposta 200)
        if (response.status === 200) {
            // Obtenha os dados JSON da resposta
            const tickers = response.data;

            const filteredTickers = tickers.filter(ticker => {
                return ticker.symbol.endsWith('USDT')
            });

            let sortedTickers = filteredTickers.sort((a, b) => parseFloat(a.lowPrice) - parseFloat(b.lowPrice));

            // console.log("sortedTickers: ", sortedTickers); // DEBUG

            return sortedTickers;
        } else {
            // Imprima uma mensagem de erro se a solicitação não for bem-sucedida
            console.error(`Erro na solicitação: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Erro na solicitação: ${error.message}`);
        return null;
    }
}

async function exchangeInfoFuturesComplete(symbol = null) {
    try {
        const params = symbol != null ? `?symbol=${symbol}` : "";
        // console.log("URL FUTURES: ", `${FUTURES_API_URL}/v1/exchangeInfo${params}`); // DEBUG

        const response = await axios.get(`${FUTURES_API_URL}/v1/exchangeInfo${params}`);
        // console.log("response.data.symbols: ", response.data.symbols); // DEBUG

        const infoSymbol = response.data.symbols.filter(s => s.symbol == symbol).map(s => {
            return s
        });

        return infoSymbol[0];
    } catch (error) {
        console.log("ERROR [exchangeInfoFuturesComplete]: ", error);
    }
}

async function newFuturesOrder(symbol, quantity, side = 'BUY', type = 'MARKET', price = 0) {
    const data = { symbol, side, type, quantity };

    if (price) data.price = parseInt(price);
    if (type === 'LIMIT') data.timeInForce = 'GTC';

    if (!API_KEY_BINANCE || !SECRET_KEY_BINANCE)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    const timestamp = Date.now();
    const recvWindow = 60000;

    const signature = crypto
        .createHmac('sha256', SECRET_KEY_BINANCE)
        .update(`${new URLSearchParams({ ...data, timestamp, recvWindow }).toString()}`)
        .digest('hex');

    const newData = { ...data, timestamp, recvWindow, signature };
    const qs = `?${new URLSearchParams(newData).toString()}`;

    console.log("qs: ", qs);

    try {
        const result = await axios({
            method: 'POST',
            url: `${FUTURES_API_URL}/v1/order${qs}`,
            headers: { 'X-MBX-APIKEY': API_KEY_BINANCE }
        });
        return result.data;
    } catch (error) {
        // console.log("ERROR [newOrder][response.data]: ", error.response.data);
        if (error.response) {
            return error.response.data;
        } else {
            return error;
        }
    }
}

// Função para obter a taxa de câmbio entre duas criptomoedas
async function getExchangeRate(symbol) {
    try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        // console.log("response: ", response.data); // DEBUG

        const exchangeRate = parseFloat(response.data.price);
        return exchangeRate;
    } catch (error) {
        console.error("Erro ao obter a taxa de câmbio:", error);
        return null;
    }
}

async function convertUSDTToSymbol(symbol, usdtAmount) {
    const conversionRate = await getExchangeRate(symbol);
    const amount = usdtAmount / conversionRate;

    return amount;
}

const getLotSize = async (symbol) => {
    try {
        const symbolInfo = await exchangeInfoFuturesComplete(symbol);
        // console.log(`symbolInfo [${symbol}]: `, symbolInfo.filters); // DEBUG

        if (symbolInfo) {
            const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
            if (lotSizeFilter) {
                const { minQty, maxQty, stepSize } = lotSizeFilter;
                return {
                    minQty: parseFloat(minQty),
                    maxQty: parseFloat(maxQty),
                    stepSize: parseFloat(stepSize)
                };
            } else {
                throw new Error(`LOT_SIZE filter not found for symbol ${symbol}`);
            }
        } else {
            throw new Error(`Symbol ${symbol} not found`);
        }
    } catch (error) {
        console.error('Error getting LOT_SIZE:', error.message);
        throw error;
    }
}

function adjustToLotSize(value, lotSizeFilter) {
    const stepSize = parseFloat(lotSizeFilter.stepSize);
    const stepSizeString = lotSizeFilter.stepSize.toString();

    const decimalPlaces = stepSizeString.indexOf('.') === -1 ? 0 : stepSizeString.split('.')[1].length;

    // Ajusta o valor para o múltiplo do stepSize mais próximo
    const adjustedValue = Math.floor(value / stepSize) * stepSize;

    // Garante que o valor ajustado seja um múltiplo do stepSize
    if (value % stepSize !== 0) {
        return (adjustedValue + stepSize).toFixed(decimalPlaces);
    } else {
        return adjustedValue.toFixed(decimalPlaces);
    }
}

const getAmountInvest = async (symbol, value) => {
    console.log("VALUE [GERADO]: ", value); // DEBUG
    let amount = await convertUSDTToSymbol(symbol, value);
    console.log("Amount [BRUTO]: ", amount); // DEBUG

    const lotSizeFilter = await getLotSize(symbol);
    console.log("lotSizeFilter: ", lotSizeFilter); // DEBUG

    return adjustToLotSize(amount, lotSizeFilter);
}

async function setLeverage(symbol, leverage = 1) {
    const data = { symbol, leverage };

    if (!API_KEY_BINANCE || !SECRET_KEY_BINANCE)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    const timestamp = Date.now();
    const recvWindow = 60000;

    const signature = crypto
        .createHmac('sha256', SECRET_KEY_BINANCE)
        .update(`${new URLSearchParams({ ...data, timestamp, recvWindow }).toString()}`)
        .digest('hex');

    const newData = { ...data, timestamp, recvWindow, signature };
    const qs = `?${new URLSearchParams(newData).toString()}`;

    console.log("qs: ", qs);

    try {
        const result = await axios({
            method: 'POST',
            url: `${FUTURES_API_URL}/v1/leverage${qs}`,
            headers: { 'X-MBX-APIKEY': API_KEY_BINANCE }
        });
        return result.data;
    } catch (error) {
        // console.log("ERROR [newOrder][response.data]: ", error.response.data);
        if (error.response) {
            return error.response.data;
        } else {
            return error;
        }
    }
}

// Função para obter os trades abertos
async function getOpenPositions(symbols) {
    const positions = await binance.futuresPositionRisk();
    return positions.filter(position => symbols.includes(position.symbol) && position.entryPrice > 0);
}

const getBalancesFutures = async () => {
    try {
        return await binance.futuresBalance();
    } catch (error) {
        console.error('Erro ao obter saldos [FUTURES]:', error.body);
    }
};

const getBalanceFuturesUsdt = async () => {
    try {
        const balances = await getBalancesFutures();
        // console.log("balances [FUTURES]: ", balances);

        let balanceUsdt = 0;
        // Iterar sobre o array de objetos
        for (let i = 0; i < balances.length; i++) {
            // Verificar se o asset é igual a "USDT"
            if (balances[i].asset === "USDT") {
                // Extrair o saldo de USDT e imprimir
                balanceUsdt = balances[i];
                break; // Terminar o loop assim que encontrar o saldo de USDT
            }
        }

        return balanceUsdt;
    } catch (error) {
        return 0;
    }
}

module.exports = {
    getHistoryCandlesSpot,
    getTopVolumePairs,
    getTopVolumePairs24h,
    getHistoryCandlesFutures,
    getHistoryCandles30DaysFutures,
    getAllKlines,
    getTopChangePairs,
    getTopLowPairs,
    getTopHighPairs,
    newFuturesOrder,
    getAmountInvest,
    setLeverage,
    getOpenPositions,
    getBalanceFuturesUsdt
}