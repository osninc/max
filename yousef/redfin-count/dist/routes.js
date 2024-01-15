"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSearch = exports.handleLocation = void 0;
const lodash_1 = __importDefault(require("lodash"));
const moment = require("moment");
const base_utils_1 = require("./base-utils");
const custom_utils_1 = require("./custom-utils");
const utils_1 = require("./utils");
const redfin_1 = require("./utils/redfin");
const handleLocation = async (crawlingContext, globalContext) => {
    const { request, crawler, log } = crawlingContext;
    const { searchType } = globalContext.input;
    const { query } = request.userData;
    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    };
    const response = crawlingContext.response;
    const placeType = redfin_1.REDFIN.PLACE_TYPE[searchType.toLowerCase()];
    const json = JSON.parse(response.body?.replace('{}&&', ''));
    const locations = json?.payload?.sections?.[0]?.rows?.filter((s) => s.type === `${placeType}`);
    let data = locations[0];
    if (searchType === 'county') {
        data = locations.find((l) => `${l.name}, ${l.subName}` === `${query}, USA`);
    }
    if (!data) {
        log.error('Error getting location data', requestInfo);
        throw new Error('Error getting location data');
    }
    const regionType = redfin_1.REDFIN.REGION_TYPE[searchType.toLowerCase()];
    const regionId = Number(data?.id?.split('_')?.[1] ?? '');
    const regionUrlPath = data?.url ?? '';
    const regionUrl = regionUrlPath ? `https://www.redfin.com${regionUrlPath}` : '';
    if (!regionId || !regionUrl) {
        log.error('Required data is missing:', { ...requestInfo, query, regionId, regionUrl });
        throw new Error('Required data is missing!');
    }
    // await Actor.pushData({ scraper, proxy, message: 'Error getting location data' })
    const region = { id: regionId, type: regionType, url: regionUrl };
    globalContext.shared.region = region;
    const { locationManager } = globalContext.shared;
    const location = { query, region };
    const requests = await (0, custom_utils_1.prepareSearchRequests)(globalContext.input, log, { ...requestInfo }, location, request.userData);
    const searchCount = requests.length;
    if (!searchCount) {
        log.error('Page has no searches:', { url: request.url });
        throw new Error(`Page has no searches: ${request.url}`);
    }
    log.info('Searches statistics:', {
        count: searchCount,
        requestInfo
    });
    globalContext.state.searchCount = searchCount;
    log.info(`Total search count: ${globalContext.state.searchCount}`);
    await locationManager.cacheLocation((0, utils_1.getValidKVSRecordKey)(request.userData.query), location);
    log.debug('Adding search requests to the RQ:', {
        count: requests.length,
        requestInfo
    });
    const crawlerAddRequestsResult = await crawler.addRequests(requests, {
        waitForAllRequestsToBeAdded: true
    });
    for (let i = 0; i < crawlerAddRequestsResult.addedRequests.length; i++) {
        const addedRequest = crawlerAddRequestsResult.addedRequests[i];
        if (!addedRequest)
            continue;
        const search = requests[i];
        const { requestId, wasAlreadyPresent } = addedRequest;
        if (wasAlreadyPresent) {
            const presentRequest = await crawler?.requestQueue?.getRequest(requestId);
            const propsToPick = Object.keys(requestInfo);
            log.info('The search request is already added to the RQ:', {
                search,
                request: { URL: request.url, ...lodash_1.default.pick(request.userData, propsToPick) },
                addedRequest: {
                    URL: presentRequest?.url,
                    ...lodash_1.default.pick(presentRequest?.userData, propsToPick)
                }
            });
        }
    }
    log.debug('Finished adding search requests to the RQ:', {
        count: requests.length,
        requestInfo
    });
};
exports.handleLocation = handleLocation;
const transformSearchData = (data) => {
    const homes = data?.payload?.originalHomes?.homes ?? data?.payload?.homes;
    const listings = (homes ?? []).map((result) => {
        let mappedResult = {
            price: '',
            lotAreaString: '',
            latitude: '',
            longitude: '',
            statusType: '',
            imgSrc: '',
            id: '',
            streetAddress: '',
            zipcode: '',
            city: '',
            state: '',
            homeStatus: '',
            timeOnRedfin: '',
            is_FSBA: false,
            url: ''
        };
        const { price: { value: price = '' } = {}, lotSize: { value: lot = 0 } = {}, latLong: { value: latLong = {} } = {}, searchStatus, propertyId, timeOnRedfin: { value: timeOnRedfinMs = NaN } = {}, streetLine: { value: streetAddress = '' } = {}, postalCode: { value: zipcode = '' } = {}, city = '', state = '', mlsStatus: homeStatus, url: urlPath } = result;
        let timeOnRedfinAsNumber;
        if (timeOnRedfinMs) {
            timeOnRedfinAsNumber = Math.floor(moment.duration(timeOnRedfinMs).asDays());
        }
        else {
            timeOnRedfinAsNumber = result.timeOnRedfin ? 0 : NaN;
        }
        const url = urlPath ? `https://www.redfin.com${urlPath}` : '';
        mappedResult = {
            ...mappedResult,
            price,
            lotAreaString: `${(0, utils_1.sqft2acre)(lot)} acres`,
            ...lodash_1.default.pick(latLong, ['latitude', 'longitude']),
            statusType: searchStatus === 1 ? 'For Sale' : 'Sold',
            id: propertyId,
            streetAddress,
            zipcode,
            city,
            state,
            homeStatus,
            timeOnRedfin: `${timeOnRedfinAsNumber} day`,
            url
            // is_FSBA: result.marketingStatusSimplifiedCd === 'For Sale by Agent'
        };
        return mappedResult;
    });
    const count = homes?.length ?? 'N/A';
    // const count = data?.cat1?.searchList?.totalResultCount ?? 'N/A'
    return { count, listings };
};
const handleSearch = async (crawlingContext, globalContext) => {
    const { request, log } = crawlingContext;
    const { query, searchUrl, region, status, lot, time } = request.userData;
    const response = crawlingContext.response;
    const requestInfo = {
        url: request.loadedUrl,
        searchUrl,
        query,
        region,
        status,
        lot,
        time
    };
    if (response.statusCode === 404) {
        globalContext.state.searchCount--;
        log.info(`Page not found (404): ${request.url}`);
        return;
    }
    const json = JSON.parse(response.body?.replace('{}&&', ''));
    try {
        transformSearchData(json);
    }
    catch (e) {
        log.error(e.message, requestInfo);
    }
    const searchData = transformSearchData(json);
    if (!searchData) {
        (0, base_utils_1.persistResponseDataIntoRequest)({ crawlingContext });
        log.error('Page has no searchData', {
            requestInfo
        });
        crawlingContext.request.noRetry = true;
        throw new Error(`Page has no searchData: ${request.url}`);
    }
    // const searchByText =
    //     request.userData.searchType === 'state' ? getState(request.userData.query) : request.userData.query
    const daysKey = request.userData.status === 'Sold' ? 'soldInLast' : 'daysOnRedfin';
    globalContext.state.searchResults.push({
        ...custom_utils_1.DEFAULT_OUTPUT,
        ...lodash_1.default.pick(globalContext.input, ['searchType', 'county', 'state', 'zipCode']),
        // [request.userData.searchType]: searchByText,
        timeStamp: utils_1.START_TIMESTAMP,
        status,
        [daysKey]: time,
        [custom_utils_1.OUTPUT_FIELDS.ACREAGE]: (0, utils_1.lotSizeToString)(lot.min, lot.max),
        url: searchUrl,
        // timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        // proxy,
        // taskName: `${globalContext.input.scraper}/${searchByText}`,
        scraper: globalContext.input.scraper,
        ...searchData
    });
};
exports.handleSearch = handleSearch;
//# sourceMappingURL=routes.js.map