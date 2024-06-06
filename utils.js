const moment = require('moment');

function roundNumber(number, price) {
    const getDecimalPlaces = (numero) => {
        const parts = numero.toString().split('.');
        return parts.length > 1 ? parts[1].length : 0;
    };

    const roundNumberInternal = (numero, minimamlDecimalPlaces) => {
        const multiplicationFactor = Math.pow(10, minimamlDecimalPlaces);
        const roundNumberCalc = (Math.round(numero * multiplicationFactor) / multiplicationFactor).toString();
        const parts = roundNumberCalc.split('.');

        // Adiciona zeros à direita, se necessário
        if (parts.length > 1) {
            parts[1] = parts[1].padEnd(minimamlDecimalPlaces, '0');
        } else if (minimamlDecimalPlaces > 0) {
            parts.push('0'.repeat(minimamlDecimalPlaces));
        }

        return parts.join('.');
    };

    const decimalPlaces = getDecimalPlaces(price);
    const priceRound = roundNumberInternal(number, decimalPlaces);

    return priceRound;
}

const candleToCloseTime = (date) => {
    // Current date
    const currentDate = moment();

    // Provided date (in this example, the date is fixed, but you can replace it with any other date)
    const providedDate = moment(date);

    /// Calculate the difference in seconds between the dates
    const secondsDifference = providedDate.diff(currentDate, 'seconds');

    // Create a duration object with the calculated seconds
    const duration = moment.duration(secondsDifference, 'seconds');

    // Format the duration as mm:ss
    const formattedMMSS = moment.utc(duration.asMilliseconds()).format('mm:ss');

    // console.log(`Remaining ${formattedMMSS} until the provided date.`); // DEBUG

    return formattedMMSS;
}

module.exports = {
    roundNumber,
    candleToCloseTime
}