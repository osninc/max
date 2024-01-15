"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapBoundsFromHtml = void 0;
const cheerio = __importStar(require("cheerio"));
const error_1 = require("./error");
const getMapBoundsFromHtml = (body, log) => {
    const $ = cheerio.load(body);
    const findTextAndReturnRemainder = (target, variable) => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length);
        const result = chopFront.substring(0, chopFront.search(';'));
        return result;
    };
    const text = $($('script')).text();
    const findAndClean = findTextAndReturnRemainder(text, 'window.mapBounds = ');
    // console.log({ text });
    // console.log({ findAndClean })
    try {
        const result = JSON.parse(findAndClean);
        return result;
    }
    catch (error) {
        console.log({ text });
        console.log({ findAndClean });
        const l = findTextAndReturnRemainder(text, 'var pxCaptchaSrc = ');
        (0, error_1.processError)('findTextAndReturnRemainder', error, log);
        throw new Error(l);
    }
};
exports.getMapBoundsFromHtml = getMapBoundsFromHtml;
//# sourceMappingURL=map.js.map