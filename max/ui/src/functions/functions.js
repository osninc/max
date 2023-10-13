export const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

export const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

export const sqft2acre = num => {
    if (num === "")
        return "";
    return parseFloat((num / 43560).toFixed(2));
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

export const calcPpa = (price,acre) => {

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

export const calcRatio = (sale, sold) => {
    if (!sold || (sold === 0) || (sold === "N/A")) return "0%";
    return `${((sale / sold) * 100).toFixed(0)}%`;
}

export const calcMos = (sale, sold, time) => {

    const calcDaysOf30 = (time) => {
        return time / 30;
    }

    const calcDaysInTimeFrame = {
        "7 days": calcDaysOf30(7),
        "30 days": calcDaysOf30(30),
        "90 days": calcDaysOf30(90),
        "6 months": calcDaysOf30(180),
        "12 months": calcDaysOf30(360),
        "24 months": calcDaysOf30(720),
        "36 months": calcDaysOf30(1080)
    }

    if (!sold || (sold === 0) || (sold === "N/A")) return "0.00";

    return (sale / sold * calcDaysInTimeFrame[time.toLowerCase()]).toFixed(2);
}

export const calcAbsorption = (sale, sold) => {
    if (!sale || (sale === 0) || (sale === "N/A")) return "0.00%";

    return `${((sold / sale) * 100).toFixed(2)}%`
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