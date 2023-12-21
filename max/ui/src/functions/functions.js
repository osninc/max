import { matrix } from '../constants/matrix.js';
import { sqft2acre } from './formulas';

export const capitalizeFirstLetter = (string) => {
    // Capitalize first letter of each word
    const words = string.split(' ');
    const wordArray = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return wordArray.join(' ');
};

export const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

export const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};

export const alphaNum = (str) => {
    return str.replace(/[^0-9a-z ]/gi, '');
};

export const alphaNumWithoutSpace = (str) => {
    return str.replace(/[^0-9a-z]/gi, '');
};

export const camelizeStr = (str) => {
    return alphaNumWithoutSpace(str);
};

export const convertArea4Zillow = (params, searchType) => {
    let str = params.usersSearchTerm;
    if (searchType.toLowerCase() === 'zipcode') {
        // Just in case city is more than one word
        str = `${params.cityState}-${params.usersSearchTerm}`;
        return str;
    } else {
        const newStr = alphaNum(str);
        return newStr.replace(/ /gi, '-').toLowerCase();
    }
};

export const lotSizeToString = (min, max) => {
    let keyName = `${min}-${max}`;

    if (max === '') keyName = `${min}+`;
    if (min === '') keyName = `0-${max}`;
    if (min === '' && max === '') keyName = 'TOTAL';

    return keyName;
};

export const convertStrToAcre = (str) => {
    const isSqft = str.toLowerCase().includes('sqft');
    let returnStr = 0;
    if (isSqft) {
        // convert to acre
        const newStr = str.replace(' sqft', '').replaceAll(',', '');
        returnStr = isNaN(newStr) ? 0 : sqft2acre(newStr);
    } else {
        const newStr = parseFloat(str.replace(' acres', '').replaceAll(',', ''));
        returnStr = isNaN(newStr) ? 0 : newStr;
    }
    return returnStr;
};

export const convertPriceStringToFloat = (str) => {
    if (typeof str === 'undefined' || str === '') return null;

    const removeComma = str.replace('$', '').replaceAll(',', '').replace('From ', '');
    const removeK = removeComma.replace('K', '000');
    // special case for millions
    let removeM;
    if (removeK.includes('M')) {
        removeM = removeK.replace('M', '');
        removeM = parseFloat(removeM * 1000000);
    } else removeM = parseFloat(removeK);

    return removeM;
};

export const convertDateToLocal = (dateStr) => {
    const timeZone = 'PST';

    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone,
        timeZoneName: 'short',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
    };

    const newDate =
        typeof dateStr === 'number'
            ? new Date(dateStr).toLocaleString('en-US', options)
            : time2epoch(dateStr).toLocaleString('en-US', options);
    return newDate;
};

export const time2epoch = (dateStr) => {
    const epochTime = Date.parse(dateStr);
    return new Date(epochTime);
};

export const getGoogleMapsUrl = (address) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export const getRealtorUrl = (source, zpid, url) => {
    switch (source) {
        case 'zillow':
            return `https://www.zillow.com/homes/${zpid}_zpid`;
            break;
        case 'redfin':
            return url;
            break;
        default:
            break;
    }
};

export const sec2min = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // const hourString = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''
    // const minuteString = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''
    // const secondString =
    //     remainingSeconds > 0 ? `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}` : ''

    const hourString = hours > 0 ? `${hours}h` : '';
    const minuteString = minutes > 0 ? `${minutes}m` : '';
    const secondString = remainingSeconds > 0 ? `${remainingSeconds}s` : '';

    if (hours > 0) {
        return `${hourString} ${minuteString || '0 m'} ${secondString && ` ${secondString}`}`;
    } else if (!hours && minutes > 0) {
        return `${minuteString} ${secondString && ` ${secondString}`}`;
    }

    return secondString;
};

export const DisplayNumber = new Intl.NumberFormat();

// TODO: 'https://www.redfin.com/county/2083/NC/Richmond-County/filter/sort=lo-days,property-type=land,max-days-on-market=1wk,min-lot-size=9.5k-sqft,max-lot-size=0.25-acre'
// TODO: change min/max lots based on combined values
// TODO: change sqft to acre
export const fixRedfinUrl = (url, timeDim, acreage, status) => {
    const source = 'redfin';
    const [min, max] = acreage.split('-');
    const lotSizeText =
        acreage === '100+' ? `min-lot-size=100-acre` : `min-lot-size=${min}-acre,max-lot-size=${max}-acre`;
    const timeText =
        status.toLowerCase() === 'sold'
            ? `include=sold-${matrix[source].time[timeDim]}`
            : `max-days-on-market=${matrix[source].time[timeDim]}`;
    const baseUrl = url.split('land,')[0];
    return `${baseUrl}land,${lotSizeText},${timeText}`;
};

export const later = (delay, value) => new Promise((resolve) => setTimeout(resolve, delay, value));

export const isOdd = (num) => {
    return num % 2 === 1;
};

export const addLeadingZero = (string, places) => {
    if (string.length === places) return string;
    //const num = places - string.length;
    return string.padStart(places, '0');
};

export const convertCountyStr = (value) => {
    const [county, state] = value.split(', ');
    return `${capitalizeFirstLetter(county)}, ${state.toUpperCase()}`;
};
