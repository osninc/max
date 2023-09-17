import axios from "axios-https-proxy-fix";
import { Actor } from "apify";

import { sqft2acre, getRandomInt } from "./functions.js";
import { getProxyUrl } from "./proxy.js";

// Get my test data
import testLarge from "../test_data/test.json" assert {type: "json"};
import testRegion from "../test_data/test_region.json" assert {type: "json"}


// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const COUNTY = 4;
const ZIPCODE = 7;
const CITY = 6;

const USETEST = false;
const USEPROXY = false;

const axiosDefaults = {
    timeout: 30000
}

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    search,
    minPrice,
    maxPrice,
    status,
    doz,
    minLotSize,
    maxLotSize,
    debug,
    proxy
} = input;

const defaults = {
    pagination: {},
    isMapVisible: false,
    isListVisible: false,
    filterState: {
        sortSelection: { value: "globalrelevanceex" },
        isLotLand: { value: true },
        isSingleFamily: { value: false },
        isTownhouse: { value: false },
        isMultiFamily: { value: false },
        isCondo: { value: false },
        isApartment: { value: false },
        isManufactured: { value: false },
        isApartmentOrCondo: { value: false }
    }
}

const defaultHeaders = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1',
    "x-requested-with": "XMLHttpRequest",
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
}

const getLocationInfo = async search => {
    /*
        Sample return JSON
        {
        "results": [
            {
                "display": "San Mateo County, CA",
                "resultType": "Region",
                "metaData": {
                    "regionId": 2842,
                    "regionType": "county",
                    "county": "San Mateo County",
                    "countyFIPS": "06081",
                    "state": "CA",
                    "country": "United States",
                    "lat": 37.43620737942326,
                    "lng": -122.35564778392194
                }
            }
        ]
        }
    */

    const offset = 10;
    const url = 'https://www.zillowstatic.com/autocomplete/v3/suggestions';

    if (USETEST) {
        const lat = testRegion.results[0].metaData.lat;
        const lng = testRegion.results[0].metaData.lng;
        const regionId = testRegion.results[0].metaData.regionId;
        return {
            mapBounds: {
                north: lat + offset,
                south: lat - offset,
                west: lng - offset,
                east: lng + offset
            },
            regionSelection: [
                {
                    regionId,
                    regionType: COUNTY
                }
            ]
        }
    }
    else {

        try {
            let finalConfig = { headers: defaultHeaders, params: { q: search }, ...axiosDefaults }

            if (USEPROXY) {
                finalConfig = {
                    ...finalConfig,
                    proxy: await getProxyUrl(proxy)
                }
            }

            if (debug) {
                console.log("LINE 144: ")
                console.log(JSON.stringify(finalConfig))
            }

            const response = await axios.get(url, finalConfig);
            const data = response.data.results;

            // Only get the result of the county regionType
            const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === "county");

            const { regionId, lat, lng } = regionResults[0].metaData;

            return {
                mapBounds: {
                    north: lat + offset,
                    south: lat - offset,
                    west: lng - offset,
                    east: lng + offset
                },
                regionSelection: [
                    {
                        regionId,
                        regionType: COUNTY
                    }
                ]
            }

        } catch (error) {
            console.log({ error })
            let message = "";
            if (error.response) {
                if (error.response.status === 404) {
                    message = "This was a bad request"
                }
            } else if (error.request) {
                message = "There was an error communicating with the server.  Please try again later.";
            } else {
                message = error.message;
            }

            const obj = { hasError: true, severity: "error", text: message }

            return {}
        }
    }
}

const transformData = data => {
    // REturn everything
    // Keep only the data we care about
    const propertiesFull = data.cat1.searchResults.listResults;
    const properties = propertiesFull.map(property => {
        // Time on zillow is milliseconds
        const lotArea = (property.hdpData?.homeInfo?.lotAreaUnit === "sqft") ? {
            lotAreaValue: sqft2acre(property.hdpData?.homeInfo?.lotAreaValue),
            lotAreaUnit: "acres",
        } : {
            lotAreaValue: property.hdpData?.homeInfo?.lotAreaValue,
            lotAreaUnit: property.hdpData?.homeInfo?.lotAreaUnit,
        }
        return {
            zpid: property.zpid,
            streetAddress: property.hdpData?.homeInfo?.streetAddress,
            zipcode: property.hdpData?.homeInfo?.zipcode,
            city: property.hdpData?.homeInfo?.city,
            state: property.hdpData?.homeInfo?.state,
            lat: property.hdpData?.homeInfo?.latitude,
            lon: property.hdpData?.homeInfo?.longitude,
            price: property.hdpData?.homeInfo?.price,
            lotAreaString: property.lotAreaString,
            ...lotArea,
            statusType: property.statusType,
            dateSold: property.hdpData?.homeInfo?.dateSold,
            timeOnZillow: property.timeOnZillow,
            detailUrl: property.detailUrl,
            image: property.imgSrc,
            unitOnZillow: property.variableData?.type,
            textOnZillow: property.variableData?.text
        }
    })
    return properties;
}

const getCountInfo = data => {
    return {
        totalPages: data.cat1.searchList.totalPages,
        resultsPerPage: data.cat1.searchList.resultsPerPage,
        count: data.categoryTotals.cat1.totalResultCount
    }
}

const getSearchResults = async searchParams => {
    const url = "https://www.zillow.com/search/GetSearchPageState.htm";

    const wants = {
        cat1: ["listResults"],
        cat2: ["total"],
        regionResults: ["regionResults"]
    };

    let finalArray = []

    if (USETEST) {
        // Check for paging
        const pagingInfo = getCountInfo(testLarge);

        Array.from({ length: pagingInfo.totalPages }, (_, i) => i + 1).map(x => {
            // Modify search params to have pagination info
            searchParams = {
                ...searchParams,
                pagination: { currentPage: x }
            }

            finalArray = [
                ...finalArray,
                ...transformData(testLarge)
            ]
        })
        return finalArray;
    }
    else {

        try {
            let finalConfig = {
                headers: defaultHeaders,
                params: {
                    searchQueryState: searchParams,
                    wants,
                    requestId: getRandomInt(20)
                },
                responseType: "json",
                ...axiosDefaults
            }

            if (USEPROXY) {
                finalConfig = {
                    ...finalConfig,
                    proxy: await getProxyUrl(proxy)
                }
            }

            if (debug) {
                console.log("LINE 270: ")
                console.log(JSON.stringify(finalConfig))
            }

            // Get info from first page
            const response = await axios.get(url, finalConfig);
            const data = response.data;

            // Check to see if there are pages of data

            // Check for paging
            const pagingInfo = getCountInfo(data);

            if (debug) {
                console.log("LINE 284: ")
                console.log(JSON.stringify(pagingInfo))
            }

            finalArray = [
                ...finalArray,
                ...transformData(data)
            ]

            if (debug) {
                console.log("LINE 294: ")
                console.log({ finalArray })
            }

            if (pagingInfo.totalPages > 1) {
                await Promise.all(Array.from({ length: pagingInfo.totalPages }, (_, i) => i + 1).map(async x => {
                    if (x === 1) return;

                    if (debug) {
                        console.log("LINE 303:")
                        console.log({ x })
                    }
                    // Modify search params to have pagination info
                    searchParams = {
                        ...searchParams,
                        pagination: { currentPage: x }
                    }
                    finalConfig = {
                        ...finalConfig,
                        params: {
                            ...finalConfig.params,
                            searchQueryState: searchParams,
                            requestId: getRandomInt(20)
                        }
                    }

                    if (debug) {
                        console.log("LINE 321: ")
                        console.log(JSON.stringify(finalConfig))
                    }

                    const response2 = await axios.get(url, finalConfig);
                    const data2 = response2.data;

                    finalArray = [
                        ...finalArray,
                        ...transformData(data2)
                    ]

                    if (debug) {
                        console.log("LINE 334: ")
                        console.log({ finalArray })
                    }
                }))
                return finalArray
            }
            else {
                return transformData(data)
            }
        } catch (error) {
            console.log({ error })
            let message = "";
            if (error.response) {
                if (error.response.status === 404) {
                    message = "This was a bad request"
                }
            } else if (error.request) {
                message = "There was an error communicating with the server.  Please try again later.";
            } else {
                message = error.message;
            }

            const obj = { hasError: true, severity: "error", text: message }

            return {}
        }
    }
}

// Get the boundaries
const loc = await getLocationInfo(search)

// { "north": 37.73621079161117, "east": -121.81160112304686, "south": 37.02582423098057, "west": -122.8580488769531 }
//console.log({ loc })
let additionalFilters = {}
if (minLotSize) {
    additionalFilters = {
        ...additionalFilters,
        lotSize: {
            ...additionalFilters.lotSize,
            min: Number(minLotSize)
        }
    }
}
if (maxLotSize) {
    additionalFilters = {
        ...additionalFilters,
        lotSize: {
            ...additionalFilters.lotSize,
            max: Number(maxLotSize)
        }
    }
}
if (minPrice) {
    additionalFilters = {
        ...additionalFilters,
        price: {
            ...additionalFilters.price,
            min: Number(minPrice)
        }
    }
}
if (maxPrice) {
    additionalFilters = {
        ...additionalFilters,
        price: {
            ...additionalFilters.price,
            max: Number(maxPrice)
        }
    }
}
if (doz) {
    additionalFilters = {
        ...additionalFilters,
        doz: { value: doz }
    }
}

if (status === "isRecentlySold") {
    additionalFilters = {
        ...additionalFilters,
        isForSaleByAgent: { value: false },
        isForSaleByOwner: { value: false },
        isNewConstruction: { value: false },
        isAuction: { value: false },
        isComingSoon: { value: false },
        isForSaleForeclosure: { value: false },
        isRecentlySold: { value: true }
    }
}
// try getting all results from 36 months and filter down depending on user input
const searchParams = {
    ...loc,
    ...defaults,
    filterState: {
        ...defaults.filterState,
        ...additionalFilters
       // doz: { value: "36m" }
    }
}

// Process everything
const newData = await getSearchResults(searchParams);

await Actor.pushData(newData);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
