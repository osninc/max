"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHeaders = exports.getValidKVSRecordKey = exports.randomXToY = exports.lotSizeToString = exports.camelizeStr = exports.alphaNumWithoutSpace = exports.alphaNum = exports.sqft2acre = exports.getRandomInt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const lodash_1 = __importDefault(require("lodash"));
const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};
exports.getRandomInt = getRandomInt;
const sqft2acre = (num) => {
    if (num === '')
        return '';
    return parseFloat((num / 43560).toFixed(2));
};
exports.sqft2acre = sqft2acre;
const alphaNum = (str) => {
    return str.replace(/[^0-9a-z ]/gi, '');
};
exports.alphaNum = alphaNum;
const alphaNumWithoutSpace = (str) => {
    return str.replace(/[^0-9a-z]/gi, '');
};
exports.alphaNumWithoutSpace = alphaNumWithoutSpace;
const camelizeStr = (str) => {
    return (0, exports.alphaNumWithoutSpace)(str);
};
exports.camelizeStr = camelizeStr;
const lotSizeToString = (min, max) => {
    let keyName = `${min}-${max}`;
    if (max === '')
        keyName = `${min}+`;
    if (min === '')
        keyName = `0-${max}`;
    if (min === '' && max === '')
        keyName = 'TOTAL';
    return keyName;
};
exports.lotSizeToString = lotSizeToString;
const randomXToY = (minVal, maxVal) => {
    const randVal = minVal + Math.random() * (maxVal - minVal);
    return Math.round(randVal);
};
exports.randomXToY = randomXToY;
const getValidKVSRecordKey = (str, hashKey = false) => {
    if (!hashKey) {
        return str.replace(/[^[a-zA-Z0-9!\-_.'()]/g, '');
        // return str.replace(/([+/=])/g, '')
    }
    return crypto_1.default
        .createHash('sha256')
        .update(str)
        .digest('base64')
        .replace(/([+/=])/g, '')
        .substr(0, 255);
};
exports.getValidKVSRecordKey = getValidKVSRecordKey;
const transformHeaders = (object) => {
    return lodash_1.default.transform(object, (r, val, key) => {
        r[lodash_1.default.lowerCase(key).replace(/ /g, () => '-')] = val;
    });
};
exports.transformHeaders = transformHeaders;
//# sourceMappingURL=atom.js.map