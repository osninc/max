"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSearchUrl = void 0;
const consts_1 = require("./consts");
const buildSearchUrl = (params) => {
    const { slug, status, lot, time } = params;
    // https://www.realtor.com/realestateandhomes-search/Washington/type-land/lot-sqft-2000-21780/dom-7?view=map
    // https://www.realtor.com/realestateandhomes-search/Washington/type-land/show-recently-sold/lot-sqft-2000-21780?view=map
    let finalPath = `https://www.realtor.com/realestateandhomes-search/${slug}/type-land`;
    if (status === 'Sold') {
        finalPath += '/show-recently-sold';
    }
    if (lot.min) {
        finalPath += `/lot-sqft-${consts_1.LOT_SIZE_FOR_URL[lot.min]}`;
    }
    if (lot.max) {
        finalPath += `/lot-sqft-${lot.min ? consts_1.LOT_SIZE_FOR_URL[lot.min] : 0}-${consts_1.LOT_SIZE_FOR_URL[lot.max]}`;
    }
    if (status === 'For Sale') {
        time > 1 && (finalPath += `/dom-${consts_1.FOR_SALE_TIME_FOR_URL[time]}`);
        finalPath += '/sby-6';
    }
    finalPath += '?view=map';
    return finalPath;
};
exports.buildSearchUrl = buildSearchUrl;
//# sourceMappingURL=url.js.map