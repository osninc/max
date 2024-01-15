"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderSearchResults = exports.createSessionFunctionBuilderCustom = void 0;
const base_utils_1 = require("../../base-utils");
const atom_1 = require("../atom");
const proxy_1 = require("../proxy");
const consts_1 = require("./consts");
const createSessionFunctionBuilderCustom = (globalContext) => {
    return (0, base_utils_1.createSessionFunctionBuilder)({
        websiteUrl: 'https://www.zillow.com/',
        // withProxyInfo: true
        extraRequestOptions: {
            headers: {
                Referer: 'https://www.zillow.com/',
                'Referrer-Policy': 'unsafe-url'
            }
        },
        proxyUrlBuilder: () => {
            let foundProxyUrl = false;
            let proxyUrl;
            while (!foundProxyUrl) {
                proxyUrl = (0, proxy_1.getSmartproxyProxyUrl)(globalContext.input);
                if (!globalContext.shared.inUseOrBlockedProxies.includes(proxyUrl)) {
                    foundProxyUrl = true;
                }
            }
            return proxyUrl;
        }
    });
};
exports.createSessionFunctionBuilderCustom = createSessionFunctionBuilderCustom;
const orderSearchResults = (searchResults) => {
    const searchResultsMap = new Map();
    // eslint-disable-next-line no-restricted-syntax
    for (const searchResult of searchResults) {
        const key = `${searchResult.status} - ${searchResult.daysOnZillow ?? searchResult.soldInLast} - ${searchResult.acreage}`;
        searchResultsMap.set(key, searchResult);
    }
    const orderedSearchResults = [];
    consts_1.STATUS_MATRIX.forEach((status) => {
        consts_1.TIME_MATRIX.forEach((t) => {
            consts_1.LOT_SIZE.forEach((lot) => {
                const lotStr = `${(0, atom_1.lotSizeToString)((0, atom_1.sqft2acre)(lot[0]), (0, atom_1.sqft2acre)(lot[1]))}`;
                const key = `${status} - ${t} - ${lotStr}`;
                const searchResult = searchResultsMap.get(key);
                if (searchResult)
                    orderedSearchResults.push(searchResult);
            });
        });
    });
    return orderedSearchResults;
};
exports.orderSearchResults = orderSearchResults;
//# sourceMappingURL=general.js.map