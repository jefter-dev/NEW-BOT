const { getAmountInvest, newFuturesOrder, setLeverage, getOpenPositions, getBalanceFuturesUsdt } = require("./dataBinance");

execute = async () => {
    const symbol = "ADAUSDT"
    let side = "BUY";

    const balandeUsdt = await getBalanceFuturesUsdt();
    console.log("balandeUsdt: ", balandeUsdt);

    // await setLeverage(symbol, 2);

    // const amount = await getAmountInvest(symbol, 6);

    // console.log("AMOUNT INVEST: ", amount);

    // const result = await newFuturesOrder(symbol, amount, side, "MARKET");
    // console.log(`RESULT OPENED [newFuturesOrder][${side}]: `, result);

    // const trades = await getOpenPositions([symbol]);
    // if (trades.length != 0) {
    //     const amountClosed = Math.abs(trades[0].positionAmt);

    //     console.log("amountClosed: ", amountClosed);
        
    //     let side = "SELL";
    //     const result = await newFuturesOrder(symbol, amountClosed, side, "MARKET");
    //     console.log(`RESULT CLOSED [newFuturesOrder][${side}]: `, result);
    // }

}

execute();