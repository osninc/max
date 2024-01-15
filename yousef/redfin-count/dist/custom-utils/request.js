"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequestBlocked = exports.getRequestConfig = void 0;
const utils_1 = require("../utils");
const redfin_1 = require("../utils/redfin");
const base_utils_1 = require("../base-utils");
const consts_1 = require("./consts");
const getRequestConfig = (destination, input, extraData) => {
    const { searchType } = input;
    let requestConfig = {};
    // change search terms depending on searchby option
    const query = (0, utils_1.getSearchQuery)(input);
    // if (isTest) {
    //     return getTestRegion(searchBy)
    // }
    const userData = {
        query
    };
    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            Referer: 'https://www.redfin.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        userData
    };
    switch (destination) {
        case consts_1.DESTINATION.LOCATION: {
            const url = redfin_1.REDFIN.URL.LOCATION.replace('QUERY', encodeURIComponent(query.toLowerCase().split(',')[0]));
            requestConfig = {
                ...baseConfig,
                url
            };
            // requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break;
        }
        case consts_1.DESTINATION.SEARCH: {
            const { searchUrl, region, status, lot, time } = extraData ?? {};
            const queryParameters = {
                al: 1,
                include_nearby_homes: true,
                market: (0, utils_1.alphaNumWithoutSpace)(query.toLowerCase()),
                ...(lot.max ? { max_parcel_size: lot.max } : {}),
                ...(lot.min ? { min_parcel_size: lot.min } : {}),
                num_homes: 5000,
                ord: 'days-on-redfin-asc',
                page_number: 1,
                region_id: region.id,
                region_type: region.type,
                ...(status === redfin_1.STATUS_MATRIX[0] ? { sf: '1,2,3,5,6,7' } : { sold_within_days: time }),
                start: 0,
                status: 9,
                ...(status === redfin_1.STATUS_MATRIX[0] ? { time_on_market_range: time } : {}),
                uipt: 5,
                v: 8
            };
            const searchDataUrl = `https://www.redfin.com/stingray/api/gis?${(0, base_utils_1.queryParametersToString)({
                queryParameters,
                encodeKey: false,
                encodeValue: false
            })}`;
            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    ...baseConfig.headers,
                    Referer: searchUrl,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                },
                userData: {
                    searchType,
                    searchUrl,
                    status,
                    lot,
                    time: (status === redfin_1.STATUS_MATRIX[0] ? redfin_1.FOR_SALE_TIME_MATRIX : redfin_1.SOLD_TIME_MATRIX).find((t) => t[0] === time)?.[1] ?? time
                }
            };
            requestConfig.userData.requestOptions = {
                // responseType: 'json',
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