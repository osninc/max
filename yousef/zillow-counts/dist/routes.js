"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSearch = exports.handleLocationRegion = exports.handleLocationMapBounds = void 0;
const crawlee_1 = require("crawlee");
const lodash_1 = __importDefault(require("lodash"));
const base_utils_1 = require("./base-utils");
const utils_1 = require("./utils");
const custom_utils_1 = require("./custom-utils");
const zillow_1 = require("./utils/zillow");
const handleLocationMapBounds = async (crawlingContext, globalContext) => {
    const { request, log } = crawlingContext;
    const { query } = request.userData;
    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    };
    const response = crawlingContext.response;
    const mapBounds = (0, utils_1.getMapBoundsFromHtml)(response.body, log);
    if (!mapBounds) {
        (0, base_utils_1.persistResponseDataIntoRequest)({ crawlingContext });
        log.error('Page has no mapBounds', {
            requestInfo
        });
        crawlingContext.request.noRetry = true;
        throw new Error(`Page has no mapBounds: ${request.url}`);
    }
    globalContext.shared.mapBounds = mapBounds;
};
exports.handleLocationMapBounds = handleLocationMapBounds;
const handleLocationRegion = async (crawlingContext, globalContext) => {
    const { request, crawler, log } = crawlingContext;
    const { searchType } = globalContext.input;
    const { query } = request.userData;
    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    };
    const response = crawlingContext.response;
    const data = response.body?.results;
    if (!data?.length) {
        // Can't process without a region
        log.error('Error getting location data from zillow', requestInfo);
        throw new Error('Error getting location data from zillow');
    }
    // Only get the result of the county regionType
    const regionResults = data.filter((d) => d.metaData?.regionType?.toLowerCase() === searchType.toLowerCase());
    const { regionId, lat, lng, city: regionCity, state: regionState } = regionResults[0].metaData;
    let mapBounds = globalContext.shared.mapBounds;
    if (regionId === 0) {
        // Can't process without a region
        log.error('Error getting location data from zillow', requestInfo);
        throw new Error('Error getting location data from zillow');
    }
    // await Actor.pushData({ scraper, proxy, message: 'Error getting location data from zillow' })
    const regionType = zillow_1.ZILLOW.REGION_TYPE[searchType.toLowerCase()];
    const region = {
        id: regionId,
        type: regionType,
        lat,
        lng,
        city: regionCity,
        state: regionState
    };
    globalContext.shared.region = region;
    let waitSecs = 0;
    while (mapBounds === undefined) {
        await (0, crawlee_1.sleep)(2000);
        waitSecs += 2;
        if (waitSecs > 6) {
            break;
        }
        mapBounds = globalContext.shared.mapBounds;
    }
    const { locationManager } = globalContext.shared;
    const location = { query, mapBounds, region };
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
exports.handleLocationRegion = handleLocationRegion;
const transformSearchData = (data) => {
    const listings = (data?.cat1?.searchResults?.mapResults ?? []).map((result) => {
        let mappedResult = {
            price: '',
            lotAreaString: '',
            latitude: '',
            longitude: '',
            statusType: '',
            imgSrc: '',
            zpid: '',
            streetAddress: '',
            zipcode: '',
            city: '',
            state: '',
            homeStatus: '',
            daysOnZillow: '',
            is_FSBA: false
        };
        const { latLong = {}, hdpData = {} } = result;
        const { homeInfo = {} } = hdpData;
        mappedResult = {
            ...mappedResult,
            ...lodash_1.default.pick(latLong, ['latitude', 'longitude']),
            ...lodash_1.default.pick(homeInfo, [
                'latitude',
                'longitude',
                'streetAddress',
                'zipcode',
                'city',
                'state',
                'homeStatus',
                'daysOnZillow'
            ]),
            ...lodash_1.default.pick(result, ['price', 'lotAreaString', 'statusType', 'imgSrc', 'zpid']),
            is_FSBA: result.marketingStatusSimplifiedCd === 'For Sale by Agent'
        };
        return mappedResult;
    });
    const agentCount = data?.categoryTotals?.cat1?.totalResultCount ?? 'N/A';
    const otherCount = data?.categoryTotals?.cat2?.totalResultCount ?? 'N/A';
    const mapCount = listings?.length ?? 'N/A';
    // const count = data?.cat1?.searchList?.totalResultCount ?? 'N/A'
    return { agentCount, otherCount, mapCount, listings };
};
const handleSearch = async (crawlingContext, globalContext) => {
    const { request, log } = crawlingContext;
    const { query, searchUrl, region, status, lot, time } = request.userData;
    const response = crawlingContext.response;
    const requestInfo = {
        url: request.loadedUrl,
        query,
        searchUrl,
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
    try {
        transformSearchData(response.body);
    }
    catch (e) {
        log.error(e.message, requestInfo);
    }
    const searchData = transformSearchData(response.body);
    if (!searchData) {
        (0, base_utils_1.persistResponseDataIntoRequest)({ crawlingContext });
        log.error('Page has no searchData', {
            requestInfo
        });
        crawlingContext.request.noRetry = true;
        throw new Error(`Page has no searchData: ${request.url}`);
    }
    // const searchTypeText =
    //     request.userData.searchType === 'state' ? getState(request.userData.query) : request.userData.query
    const daysKey = request.userData.status === 'Sold' ? 'soldInLast' : 'daysOnZillow';
    globalContext.state.searchResults.push({
        ...custom_utils_1.DEFAULT_OUTPUT,
        ...lodash_1.default.pick(globalContext.input, ['searchType', 'county', 'state', 'zipCode']),
        // [request.userData.searchType]: searchTypeText,
        timeStamp: utils_1.START_DATETIME,
        status,
        [daysKey]: time,
        [custom_utils_1.OUTPUT_FIELDS.ACREAGE]: lot,
        url: searchUrl,
        // timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        // proxy,
        // taskName: `${globalContext.input.scraper}/${searchTypeText}`,
        scraper: globalContext.input.scraper,
        ...searchData,
        '#debug': {
            proxyUrl: crawlingContext.session?.userData?.proxyUrl
        }
    });
};
exports.handleSearch = handleSearch;
//# sourceMappingURL=routes.js.map