import axios from "axios";
import { Actor } from "apify";

// Get my test data
import testData from "../test_data/san_mateo_4_7days.json" assert { type: 'json' };
import testLarge from "../test_data/test.json" assert {type: "json"};
import testRegion from "../test_data/test_region.json" assert {type: "json"}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const COUNTY = 4;
const ZIPCODE = 7;
const CITY = 6;

const USETEST = false;
const USEPROXY = false;

const getProxyUrl = async () => {
    const proxyConfiguration = await Actor.createProxyConfiguration({
        groups: ["RESIDENTIAL"],
    });
    // Example http://bob:password123@proxy.example.com:8000
    const urlObj = new URL(await proxyConfiguration.newUrl());
    return {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname,
        port: urlObj.port,
        auth: {
            username: urlObj.username,
            password: urlObj.password
        }
    }
}


const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
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
            let finalConfig = { headers: defaultHeaders, params: { q: search } }

            if (USEPROXY) {
                finalConfig = {
                    ...finalConfig,
                    proxy: await getProxyUrl()
                }
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
    // Keep only the data we care about
    const propertiesFull = data.cat1.searchResults.mapResults;
    const properties = propertiesFull.map(property => {
        return {
            zpid: property.zpid,
            streetAddress: property.hdpData?.homeInfo?.streetAddress,
            zipcode: property.hdpData?.homeInfo?.zipcode,
            city: property.hdpData?.homeInfo?.zipcode,
            state: property.hdpData?.homeInfo?.zipcode,
            lat: property.hdpData?.homeInfo?.latitude,
            lon: property.hdpData?.homeInfo?.longitude,
            price: property.hdpData?.homeInfo?.price,
            lotAreaValue: property.hdpData?.homeInfo?.lotAreaValue,
            lotAreaUnit: property.hdpData?.homeInfo?.lotAreaUnit
        }
    })
    return {
        totalPages: data.cat1.searchList.totalPages,
        resultsPerPage: data.cat1.searchList.resultsPerPage,
        count: data.categoryTotals.cat1.totalResultCount,
        results: properties
    };

}

const getSearchResults = async searchParams => {
    const url = "https://www.zillow.com/search/GetSearchPageState.htm";


    const wants = {
        cat1: ["mapResults"],
        cat2: ["total"],
        regionResults: ["regionResults"]
    };
    const requestId = getRandomInt(20);

    if (USETEST) {
        return transformData(testLarge);
    }
    else {

        try {
            let finalConfig = {
                headers: defaultHeaders,
                params: { searchQueryState: encodeURIComponent(JSON.stringify(searchParams)), wants: encodeURIComponent(JSON.stringify(wants)), requestId: requestId },
                responseType: "json"
            }

            if (USEPROXY) {
                finalConfig = {
                    ...finalConfig,
                    proxy: await getProxyUrl()
                }
            }
            const response = await axios.get(url, finalConfig);
            const data = response.data;

            return transformData(data)

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

const searchParams = {
    ...loc,
    defaults: {
        ...defaults,
        filterState: {
            ...defaults.filterState,
            ...additionalFilters
        }
    }
}

// Process everything
const newData = await getSearchResults(searchParams);

await Actor.pushData(newData.results);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
