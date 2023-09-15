import axios from "axios-https-proxy-fix";
import { Actor } from "apify";

const USETEST = false;
const USEPROXY = true;
const DEBUG = false;

// Get my test data
//import testLarge from "../test_data/test_san_diego_page1.json" assert {type: "json"};
//import testRegion from "../test_data/test_san_diego_region.json" assert {type: "json"};

const statusMatrix = ["For Sale", "Sold"];
const timeMatrix = [
    ["7","7 days"],
    ["30","30 days"], 
    ["90","90 days"],
    ["6m","6 months"], 
    ["12m","12 months"], 
    ["24m","24 months"], 
    ["36m","36 months"]
];
const lotSize = [
    ["", "1000"],
    ["1000", "43560"],
    ["43560", "87120"],
    ["87120", "217800"],
    ["217800", "435600"],
    ["435600", "871200"],
    ["871200", "2178000"],
    ["2178000", "4356000"],
    ["4356000", ""]
]

// const statusMatrix = ["Sold"];
// const timeMatrix = [["36m", "36 months"]];
// const lotSize = [
//     ["", ""]
// ]

const axiosDefaults = {
    timeout: 10000
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const COUNTY = 4;
const ZIPCODE = 7;
const CITY = 6;

const getProxyUrl = async () => {
    const proxyConfiguration = await Actor.createProxyConfiguration({
        groups: ["RESIDENTIAL"],
    });
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

    if (DEBUG)
        console.log({ obj })

    return obj;
}


const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    search
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
                const proxy = await getProxyUrl()
                finalConfig = {
                    ...finalConfig,
                    rejectUnauthorized: false,
                    proxy
                }
            }
            const response = await axios.get(url, finalConfig);
            const data = response.data.results;

            // Only get the result of the county regionType
            const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === "county");

            const { regionId, lat, lng } = regionResults[0].metaData;

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
                        regionType: COUNTY
                    }
                ]
            }

            if (DEBUG)
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
    return { count: data.categoryTotals.cat1.totalResultCount }
    // // Keep only the data we care about
    // const propertiesFull = data.cat1.searchResults.listResults;
    // const properties = propertiesFull.map(property => {
    //     return {
    //         zpid: property.zpid,
    //         streetAddress: property.hdpData?.homeInfo?.streetAddress,
    //         zipcode: property.hdpData?.homeInfo?.zipcode,
    //         city: property.hdpData?.homeInfo?.zipcode,
    //         state: property.hdpData?.homeInfo?.zipcode,
    //         lat: property.hdpData?.homeInfo?.latitude,
    //         lon: property.hdpData?.homeInfo?.longitude,
    //         price: property.hdpData?.homeInfo?.price,
    //         lotAreaValue: property.hdpData?.homeInfo?.lotAreaValue,
    //         lotAreaUnit: property.hdpData?.homeInfo?.lotAreaUnit
    //     }
    // })
    // return {
    //     totalPages: data.cat1.searchList.totalPages,
    //     resultsPerPage: data.cat1.searchList.resultsPerPage,
    //     count: data.categoryTotals.cat1.totalResultCount,
    //     //results: properties
    // };
}

const getSearchResults = async searchParams => {
    const url = "https://www.zillow.com/search/GetSearchPageState.htm";

    const wants = {
        cat1: ["listResults"],
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
                responseType: "json",
                ...axiosDefaults
            }

            if (USEPROXY) {
                const proxy = await getProxyUrl();
                finalConfig = {
                    ...finalConfig,
                    proxy,
                    rejectUnauthorized: false
                }
            }

            if (DEBUG)
                console.log({ finalConfig })

            const response = await axios.get(url, finalConfig);
            const data = response.data;

            return transformData(data)

        } catch (error) {
            console.log("error")
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

let additionalFilters = {}
let searchParams = {}
let newData = []

// Loop through everything
const results = await Promise.all(statusMatrix.map(async status => {
    additionalFilters = {}
    if (status === "Sold") {
        additionalFilters = {
            isForSaleByAgent: { value: false },
            isForSaleByOwner: { value: false },
            isNewConstruction: { value: false },
            isAuction: { value: false },
            isComingSoon: { value: false },
            isForSaleForeclosure: { value: false },
            isRecentlySold: { value: true }
        }
    }
    await Promise.all(timeMatrix.map(async t => {
        additionalFilters = {
            ...additionalFilters,
            doz: { value: t[0] }
        }
        await Promise.all(lotSize.map(async lot => {
            if (DEBUG)
                console.log({ lot })
            if (lot[0] !== "") {
                additionalFilters = {
                    ...additionalFilters,
                    lotSize: {
                        min: Number(lot[0])
                    }
                }
            }
            if (lot[1] !== "") {
                additionalFilters = {
                    ...additionalFilters,
                    lotSize: {
                        max: Number(lot[1])
                    }
                }
            }

            searchParams = {
                ...loc,
                ...defaults,
                filterState: {
                    ...defaults.filterState,
                    ...additionalFilters
                }
            }


            if (DEBUG)
                console.log(searchParams)


            // Process everything
            const results = await getSearchResults(searchParams)
            const finalResults = {
                status,
                time: t[1],
                minLotSize: lot[0],
                maxLotSize: lot[1],
                ...results,

            }
            newData = [
                ...newData,
                finalResults
            ];

        }))
    }))
}))
if (DEBUG)
    await console.log(newData)

await Actor.pushData(newData);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
