"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareSearchRequests = void 0;
const base_utils_1 = require("../base-utils");
const redfin_1 = require("../utils/redfin");
const consts_1 = require("./consts");
const request_1 = require("./request");
const prepareSearchRequests = async (input, log, logInfo, location, userData) => {
    const { query, region } = location;
    if (!query || !region) {
        log.error('Required data is missing:', { ...logInfo, query, region });
        throw new Error('prepareSearchRequests: Required data is missing!');
    }
    let statusMatrix = [];
    let timeMatrix = [];
    let lotSize = [];
    if (input.isTest) {
        statusMatrix = ['For Sale'];
        timeMatrix = [['36m', '36 months']];
        lotSize = [['435600', '871200']];
    }
    else {
        statusMatrix = redfin_1.STATUS_MATRIX;
        timeMatrix = redfin_1.FOR_SALE_TIME_MATRIX;
        lotSize = redfin_1.LOT_SIZE;
    }
    const searches = [];
    statusMatrix.forEach((status) => {
        timeMatrix = status === redfin_1.STATUS_MATRIX[0] ? redfin_1.FOR_SALE_TIME_MATRIX : redfin_1.SOLD_TIME_MATRIX;
        timeMatrix.forEach((timeArr) => {
            lotSize.forEach((lotArr) => {
                const lot = { min: Number(lotArr[0]), max: Number(lotArr[1]) };
                const searchUrl = (0, redfin_1.buildSearchUrl)({ region, status, lot, time: timeArr[0] });
                const extraData = {
                    searchUrl,
                    region,
                    status,
                    lot,
                    time: timeArr[0]
                };
                const requestConfig = (0, request_1.getRequestConfig)(consts_1.DESTINATION.SEARCH, input, extraData);
                searches.push({
                    url: requestConfig.userData.searchUrl,
                    requestParams: requestConfig
                });
            });
        });
    });
    const searchRequests = searches.map((search) => {
        const { url = '', requestParams = { url }, name, key = url || name } = search;
        return {
            ...requestParams,
            uniqueKey: (0, base_utils_1.getValidKey)(`${consts_1.LABELS.SEARCH}_${key}`),
            userData: {
                ...userData,
                label: consts_1.LABELS.SEARCH,
                search,
                ...search?.requestParams?.userData
            }
        };
    });
    return searchRequests;
};
exports.prepareSearchRequests = prepareSearchRequests;
//# sourceMappingURL=preparation.js.map