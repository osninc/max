import { Actor } from "apify";
import { sqft2acre, alphaNum, lotSizeToString } from "./functions.js";

import { buildZillowUrl } from "./zillowUrl.js";
import { getSearchResults, getLocationInfo } from "./network.js";
import { getState } from "./state.js";
import { rate } from "./constants/rate.js";
import { createCrawleeObj, processAryOfUrls } from "./network/crawlee.js";
import { getSearchInfo } from "./output.js";

const USETEST = false;
const USEDEV = false;

let statusMatrix = [];
let timeMatrix = [];
let lotSize = [];

const startScript = performance.now();

if (USEDEV) {
    statusMatrix = ["For Sale"];
    timeMatrix = [["36m", "36 months"]];
    lotSize = [
        ["435600", "871200"]
    ]
}
else {
    statusMatrix = [
        "For Sale",
        "Sold"
    ];
    timeMatrix = [
        ["7", "7 Days"],
        ["30", "30 Days"],
        ["90", "90 Days"],
        ["6m", "6 Months"],
        ["12m", "12 Months"],
        ["24m", "24 Months"],
        ["36m", "36 Months"]
    ];
    lotSize = [
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

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    county,
    debug,
    proxyType: proxyInput,
    searchType: searchBy,
    state,
    zipCode,
    scraper: scraperInput
} = input;

const scraper = scraperInput === "CRAWLEE_SEND_REQUEST" ? "crawlee" : "axios";
let proxy = proxyInput; 
switch(proxyInput) {
    case "APIFY_DATACENTER":
        proxy = "default";
        break;
    case "none":
        proxy = "none";
        break;
    default:
        proxy = "residential";
}

const ts = new Date();
const START_TIMESTAMP = ts.getTime();

// change search terms depending on searchby option
let realSearch = county;
switch (searchBy.toLowerCase()) {
    case "zipcode":
        realSearch = zipCode;
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

// Get the boundaries
const loc = await getLocationInfo(searchBy, realSearch, proxy, USETEST, scraper)

// For crawlee
let arrayOfUrls = [];

if (true) {
    if (loc.regionSelection.regionType === 0) // Can't process without a region
        await Actor.pushData({ scraper, proxy, message: "Error getting location data from zillow" });
    else {
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

                    const url = buildZillowUrl(status, searchParams, searchBy);
                    const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`;

                    // Process everything
                    let startTime, endTime;
                    let results;
                    if (scraper === "crawlee") {
                        const crawleeObj = createCrawleeObj(searchParams, url, searchBy, status, lotStr, t[1])
                        //const crawleeObj = await getSearchResults(searchParams, url, proxy, USETEST, scraper)
                        arrayOfUrls = [...arrayOfUrls, crawleeObj];
                    }
                    else {
                        startTime = performance.now();
                        results = await getSearchResults(searchParams, url, proxy, USETEST, scraper);
                        endTime = performance.now();

                        const searchByText = (searchBy === "state") ? getState(realSearch) : realSearch;
                        const daysKey = (status === "Sold") ? "soldInLast" : "daysOnZillow";

                        const blankFields = {
                            county: "",
                            state: "",
                            zipCode: "",
                            soldInLast: "",
                            daysOnZillow: ""
                        }

                        const finalResults = {
                            ...blankFields,
                            searchType: searchByText,
                            timeStamp: ts.toString(),
                            status,
                            [daysKey]: t[1],
                            acreage: lotStr,
                            url,
                            timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
                            proxyType: proxyInput,
                            scraper: scraperInput,
                            ...results,
                        }
                        newData = [
                            ...newData,
                            finalResults
                        ];
                    }
                }))
            }))
        }))

        if (scraper === "crawlee") {
            newData = await processAryOfUrls(arrayOfUrls, proxy, ts)
        }

        const endScript = performance.now();

        // Count N/A vs. count
        const totalResults = newData.length;
        const totalNA = newData.filter(data => data.count === "N/A").length;
        const failureRate = `${(totalNA / totalResults).toFixed(2) * 100} %`
        //const secDiff = (endScript - startScript) / 1000;
        let secDiff = 0;
        const howMany10Seconds = parseInt(secDiff / 10);
        //const estimatedCost = `$${((howMany10Seconds === 0 ? 1 : howMany10Seconds) * rate[proxy]).toFixed(3)}`;
        let estimatedCost = 0;
        //const totalRunTime = `${(secDiff).toFixed(2)} seconds`
        const { actorRunId, defaultDatasetId } = Actor.getEnv();
        const datasetId = defaultDatasetId
        const actorRun = await Actor.apifyClient.run(actorRunId ?? '').get()
        if (actorRun) {
            secDiff = actorRun.stats.runTimeSecs
            estimatedCost = actorRun.stats.computeUnits
        } else {
            secDiff = 0
            estimatedCost = 0
        }
        secDiff += 4
        estimatedCost += 4
        const estimatedCostStr = `$${estimatedCost?.toFixed(3)}`
        const totalRunTime = `${secDiff.toFixed(2)} seconds`

        // Push 1st row to match debug row
        await Actor.pushData({
            '#debug': {}
        })

        await Actor.pushData({
            proxyType: proxyInput,
            scraper: scraperInput,
            area: realSearch,
            total: totalResults,
            totalFailed: totalNA,
            failureRate,
            estimatedCost: estimatedCostStr,
            totalRunTime,
            datasetId
        })

        if (debug)
            await console.log(newData)

        await Actor.pushData(newData);

        // Lastly, update the dataset with a name
        const searchInfo = getSearchInfo(input)
        const datasetName = `Zillow-${searchInfo.geo}-${searchInfo.code}-${START_TIMESTAMP}`
        await Actor.apifyClient.dataset(datasetId).update({
            name: datasetName
        })
     
    }
}
// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
