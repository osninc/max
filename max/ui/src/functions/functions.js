import { sqft2acre } from "./formulas.js";

export const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

export const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

export const alphaNum = str => {
    return str.replace(/[^0-9a-z ]/gi, '')
}

export const alphaNumWithoutSpace = str => {
    return str.replace(/[^0-9a-z]/gi, '')
}

export const camelizeStr = str => {
    return alphaNumWithoutSpace(str);
}

export const convertArea4Zillow = (params, searchType) => {
    let str = params.usersSearchTerm;
    if (searchType.toLowerCase() === "zipcode") {
        // Just in case city is more than one word 
        str = `${params.cityState}-${params.usersSearchTerm}`;
        return str;
    }
    else {
        const newStr = alphaNum(str);
        return newStr.replace(/ /gi, "-").toLowerCase();
    }
}

export const lotSizeToString = (min, max) => {
    let keyName = `${min}-${max}`;

    if (max === "") keyName = `${min}+`;
    if (min === "") keyName = `0-${max}`;
    if ((min === "") && (max === "")) keyName = "TOTAL";

    return keyName;
}

export const convertStrToAcre = str => {
    const isSqft = str.toLowerCase().includes("sqft")
    let returnStr = 0;
    if (isSqft) {
        // convert to acre
        const newStr = str.replace(" sqft", "").replaceAll(",", "");
        returnStr = isNaN(newStr) ? 0 : sqft2acre(newStr);
    }
    else {
        const newStr = parseFloat(str.replace(" acres", "").replaceAll(",", ""));
        returnStr = isNaN(newStr) ? 0 : newStr;
    }
    return returnStr

}


export const convertPriceStringToFloat = str => {
    if ((typeof str === 'undefined') || (str === "")) return null;

    return parseFloat(str.replace("$", "").replaceAll(",", "").replace("From ", "").replace("K", "000").replace("M", "000000"))
}

export const convertDateToLocal = dateStr => {

    const timeZone = "PST";

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone,
        timeZoneName: "short",
        hour12: true,
        hour: "numeric",
        minute: "numeric"
    };

    const epochTime = Date.parse(dateStr);
    const newDate = new Date(epochTime).toLocaleString("en-US", options);
    return newDate
}

export const getGoogleMapsUrl = address => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export const getZillowUrl = zpid => {
    return `https://www.zillow.com/homes/${zpid}_zpid`
}