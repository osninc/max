import { Actor } from "apify";
import { sqft2acre, alphaNum, lotSizeToString } from "./functions.js";

import { buildZillowUrl } from "./zillowUrl.js";
import { getSearchResults, getLocationInfo } from "./network.js";
import { getState } from "./state.js";


// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const USETEST = false;

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

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    searchBy,
    county,
    state,
    zipCode,
    minPrice,
    maxPrice,
    status,
    doz,
    minLotSize,
    maxLotSize,
    debug,
    proxy
} = input;

let scraper = "got"

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

const ts = new Date();

// Get the boundaries
const loc = await getLocationInfo(searchBy, realSearch, proxy, USETEST, scraper)

//console.log(JSON.stringify(loc))
// { "north": 37.73621079161117, "east": -121.81160112304686, "south": 37.02582423098057, "west": -122.8580488769531 }
//console.log({ loc })
if (loc.regionSelection.regionType === 0) // Can't process without a region
    await Actor.pushData({ scraper, proxy, message: "Error getting location data from zillow" });
else {
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
            ...soldParams
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
    const url = buildZillowUrl(status, searchParams, searchBy);
    //const newData = await getSearchResults(searchParams);
    const results = await getSearchResults(searchParams, url, proxy, USETEST, scraper);

    await Actor.pushData(results);
}
// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
