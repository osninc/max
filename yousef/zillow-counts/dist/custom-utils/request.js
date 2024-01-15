"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequestBlocked = exports.getRequestConfig = void 0;
const utils_1 = require("../utils");
const zillow_1 = require("../utils/zillow");
const consts_1 = require("./consts");
const getRequestConfig = (destination, input, extraData) => {
    const { searchType } = input;
    let requestConfig = {};
    // change search terms depending on searchby option
    const query = (0, utils_1.getSearchQuery)(input);
    // Determine regiontype
    let nameForUrl = query;
    // const regionType = zillow.regionType[searchType.toLowerCase()]
    if (['city', 'county'].includes(searchType.toLowerCase())) {
        nameForUrl = (0, utils_1.alphaNum)(query).replace(/ /gi, '-').toLowerCase();
    }
    // if (isTest) {
    //     return getTestRegion(searchType)
    // }
    const userData = {
        query
    };
    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            referer: 'https://www.zillow.com/',
            'referrer-policy': 'unsafe-url'
        },
        userData
    };
    switch (destination) {
        case consts_1.DESTINATION.LOCATION_MAP_BOUNDS: {
            const url = zillow_1.ZILLOW.URL.MAP_BOUND.replace('NAME', nameForUrl);
            requestConfig = {
                ...baseConfig,
                url
            };
            requestConfig.userData.requestOptions = { searchParams: { q: query } };
            break;
        }
        case consts_1.DESTINATION.LOCATION_REGION: {
            requestConfig = {
                ...baseConfig,
                url: zillow_1.ZILLOW.URL.REGION
            };
            requestConfig.userData.requestOptions = { responseType: 'json', searchParams: { q: query } };
            break;
        }
        case consts_1.DESTINATION.SEARCH: {
            const { searchUrl, searchParams, status, lot, time } = extraData ?? {};
            const requestId = (0, utils_1.getRandomInt)(20);
            const searchDataUrl = `${zillow_1.ZILLOW.URL.SEARCH}?searchQueryState=${encodeURIComponent(JSON.stringify(searchParams.searchQueryState))}&wants=${encodeURIComponent(JSON.stringify(zillow_1.ZILLOW.WANTS))}&requestId=${requestId}`;
            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    referer: searchUrl,
                    'referrer-policy': 'unsafe-url'
                },
                userData: {
                    searchType,
                    status,
                    searchUrl,
                    realSearch: searchParams.searchQueryState.usersSearchTerm,
                    lot,
                    time
                }
            };
            requestConfig.userData.requestOptions = {
                responseType: 'json',
                headerGeneratorOptions: { ...utils_1.RANDOM_HEADERS }
                // searchParams: {
                //     ...searchParams,
                //     requestId
                // }
            };
            break;
        }
        default:
            throw new Error(`Unknown destination: ${destination}`);
    }
    return requestConfig;
};
exports.getRequestConfig = getRequestConfig;
const isRequestBlocked = (statusCode, body) => statusCode === 403 ||
    (typeof body === 'string' && body?.includes('Request blocked')) ||
    (typeof body === 'object' && body?.blockScript?.includes('captcha'));
exports.isRequestBlocked = isRequestBlocked;
//# sourceMappingURL=request.js.map