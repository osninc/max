import { Actor } from "apify";
import { sqft2acre, alphaNum, lotSizeToString } from "./functions.js";

import { buildZillowUrl } from "./zillowUrl.js";
import { getSearchResults, getLocationInfo } from "./network.js";

const USETEST = false;
const USEDEV = false;

let statusMatrix = [];
let timeMatrix = [];
let lotSize = [];

if (USEDEV) {
    statusMatrix = ["Sold"];
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
    proxy,
    searchBy,
    state,
    zipCode
} = input;

const ts = new Date();

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
const loc = await getLocationInfo(searchBy, realSearch, proxy, USETEST)

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
            const results = await getSearchResults(searchParams, url, proxy, USETEST)

            const finalResults = {
                [searchBy]: realSearch,
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

await Actor.pushData(newData);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
