"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSearchUrl = void 0;
const consts_1 = require("./consts");
const buildSearchUrl = (params) => {
    const { region, status, lot, time } = params;
    // http://www.redfin.com/city/9168/NJ/Jersey-City/filter/sort=lo-days,property-type=land,min-lot-size=2k-sqft,max-lot-size=0.25-acre,include=sold-3mo
    let finalPath = `${region.url}/filter/sort=lo-days,property-type=land`;
    if (status === 'For Sale') {
        finalPath += `,${time.startsWith('-') ? 'min' : 'max'}-days-on-market=${consts_1.FOR_SALE_TIME_FOR_URL[time]}`;
    }
    if (lot.min) {
        finalPath += `,min-lot-size=${consts_1.LOT_SIZE_FOR_URL[lot.min]}`;
    }
    if (lot.max) {
        finalPath += `,max-lot-size=${consts_1.LOT_SIZE_FOR_URL[lot.max]}`;
    }
    if (status === 'Sold') {
        finalPath += `,include=sold-${consts_1.SOLD_TIME_FOR_URL[time]}`;
    }
    return finalPath;
};
exports.buildSearchUrl = buildSearchUrl;
//# sourceMappingURL=url.js.map