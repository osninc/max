export const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

export const sqft2acre = num => {
    if (num === "")
        return "";
    return parseFloat((num / 43560).toFixed(2));
}

export const alphaNum = str => {
    return str.replace(/[^0-9a-z\ ]/gi, '')
}

export const alphaNumWithoutSpace = str => {
    return str.replace(/[^0-9a-z]/gi, '')
}

export const camelizeStr = str => {
    return alphaNumWithoutSpace(str);
}

export const convertArea4Zillow = str => {
    const newStr = alphaNum(str);
    return newStr.replace(/\ /gi, "-").toLowerCase();
}

export const lotSizeToString = (min, max) => {
    let keyName = `${min}-${max}`;

    if (max === "") keyName = `${min}+`;
    if (min === "") keyName = `0-${max}`;

    return keyName;
}