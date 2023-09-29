import axios from "axios-https-proxy-fix";
import { Actor } from "apify";
import { orderData } from "./orderData.js";
import { sqft2acre, getRandomInt, alphaNum, camelizeStr, lotSizeToString } from "./functions.js";

import { buildZillowUrl } from "./zillowUrl.js";

const USETEST = false;

// Get my test data
import testLarge from "../test_data/test_san_diego_page1.json" assert {type: "json"};
import testRegion from "../test_data/test_san_diego_region.json" assert {type: "json"};
import testCounts from "../test_data/dataset_maxeverythingcount_2023-09-23_19-03-24-717.json" assert { type: "json" }


const statusMatrix = [
    "For Sale",
     "Sold"
];
const timeMatrix = [
    ["7", "7 Days"],
    ["30", "30 Days"],
    ["90", "90 Days"],
    ["6m", "6 Months"],
    ["12m", "12 Months"],
    ["24m", "24 Months"],
    ["36m", "36 Months"]
];
const lotSize = [
    ["", "43560"],
    ["43560", "87120"],
    ["87120", "217800"],
    ["217800", "435600"],
    ["435600", "871200"],
    ["871200", "2178000"],
    ["2178000", "4356000"],
    ["4356000", ""],
    ["", ""]
]

// const statusMatrix = ["Sold"];
// const timeMatrix = [["36m", "36 months"]];
// const lotSize = [
//     ["", ""]
// ]

const axiosDefaults = {
    timeout: 30000
}

const soldParams = {
    isForSaleByAgent: { value: false },
    isForSaleByOwner: { value: false },
    isNewConstruction: { value: false },
    isAuction: { value: false },
    isComingSoon: { value: false },
    isForSaleForeclosure: { value: false },
    isRecentlySold: { value: true },
    isAllHomes: { value: true }
}

// const newData1 = orderData("Los Angeles County, CA", testCounts);

// await Actor.init();
// await Actor.pushData(newData1);

// // Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
// await Actor.exit();

// process.exit();

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const COUNTY = 4;
const ZIPCODE = 7;
const CITY = 6;
const STATE = 2;



const getProxyUrl = async (proxy) => {
    const groups = (proxy === "residential") ? { groups: ["RESIDENTIAL"] } : {};
    const proxyConfiguration = await Actor.createProxyConfiguration(groups);
    // Example http://bob:password123@proxy.example.com:8000
    const proxyUrl = await proxyConfiguration.newUrl();
    const urlObj = new URL(proxyUrl);
    const obj = {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname,
        port: urlObj.port,
        auth: {
            username: urlObj.username,
            password: process.env.APIFY_PROXY_PASSWORD
        }
    }

    if (debug)
        console.log({ obj })

    return obj;
}

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    county,
    debug,
    proxy,
    searchby,
    state,
    zipcode
} = input;

const ts = new Date();

// change search terms depending on searchby option
let realSearch = county;
switch (searchby) {
    case "zipcode":
        realSearch = zipcode;
        break;
    case "state":
        realSearch = state
        break;
}

const defaults = {
    pagination: {},
    isMapVisible: true,
    isListVisible: true,
    usersSearchTerm: alphaNum(realSearch),
    mapZoom: 8,
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
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
    "sec-ch-ua":
        '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
}

const getLocationInfo = async (searchType, search) => {
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

    // Determine regiontype
    let regionType = COUNTY;
    switch (searchType) {
        case "zipcode":
            regionType = ZIPCODE;
            break;
        case "state":
            regionType = STATE;
            break;
        case "city":
            regionType = CITY;
            break;
    }

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
                    regionType
                }
            ]
        }
    }
    else {
        try {
            let finalConfig = { headers: defaultHeaders, params: { q: search }, ...axiosDefaults }

            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy)
                finalConfig = {
                    ...finalConfig,
                    rejectUnauthorized: false,
                    proxy: proxyUrl
                }
            }
            const response = await axios.get(url, finalConfig);
            const data = response.data.results;

            // Only get the result of the county regionType
            const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === searchType);

            const { regionId, lat, lng } = regionResults[0].metaData;
            let extraMeta = {}

            // If it's a zipcode, need the city and state name
            if (searchType === "zipcode")
                extraMeta = {
                    cityState: `${regionResults[0].metaData.city}-${regionResults[0].metaData.state}`.toLowerCase()
                }

            const obj = {
                mapBounds: {
                    north: lat + offset,
                    south: lat - offset,
                    west: lng - offset,
                    east: lng + offset
                },
                regionSelection: [
                    {
                        regionId,
                        regionType
                    }
                ],
                ...extraMeta
            }

            if (debug)
                console.log(JSON.stringify(obj))

            return obj

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
    return { count: data.categoryTotals.cat1.totalResultCount ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

const getSearchResults = async (searchQueryState, refererUrl) => {
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
                headers: {
                    ...defaultHeaders,
                    Referer: refererUrl,
                    "Referrer-Policy": "unsafe-url",
                },
                params: {
                    searchQueryState,
                    wants,
                    requestId
                },
                responseType: "json",
                ...axiosDefaults
            }

            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy);
                finalConfig = {
                    ...finalConfig,
                    proxy: proxyUrl,
                    rejectUnauthorized: false
                }
            }

            if (debug)
                console.log({ finalConfig })

            const response = await axios.get(url, finalConfig);
            const data = response.data;

            return transformData(data)
            //return { count: 0 }


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
const loc = await getLocationInfo(searchby, realSearch)

let additionalFilters = {}
let searchParams = {}
let newData = []

// Loop through everything
const results = await Promise.all(statusMatrix.map(async status => {
    additionalFilters = {}
    if (status === "Sold") {
        additionalFilters = {
            ...soldParams
        }
    }
    await Promise.all(timeMatrix.map(async t => {
        let timeFilter = {}
        timeFilter = {
            ...timeFilter,
            doz: { value: t[0] }
        }
        await Promise.all(lotSize.map(async lot => {
            if (debug)
                console.log({ lot })
            let newFilters = {}
            if (lot[0] !== "") {
                newFilters = {
                    ...newFilters,
                    lotSize: {
                        min: Number(lot[0])
                    }
                }
            }
            if (lot[1] !== "") {
                newFilters = {
                    ...newFilters,
                    lotSize: {
                        ...newFilters.lotSize,
                        max: Number(lot[1])
                    }
                }
            }

            searchParams = {
                ...loc,
                ...defaults,
                filterState: {
                    ...defaults.filterState,
                    ...additionalFilters,
                    ...timeFilter,
                    ...newFilters
                }
            }


            if (debug)
                console.log(searchParams.filterState)

            const url = buildZillowUrl(status, searchParams, searchby);
            const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`;

            // Process everything
            const results = await getSearchResults(searchParams, url)


            const finalResults = {
                area: realSearch,
                timeStamp: ts.toString(),
                status,
                daysOnZillowOrSoldInLast: t[1],
                acreage: lotStr,
                url,
                ...results,

            }
            newData = [
                ...newData,
                finalResults
            ];

        }))
    }))
}))
if (debug)
    await console.log(newData)

// redo the data
//const apifyData = await orderData(search, newData)

await Actor.pushData(newData);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
