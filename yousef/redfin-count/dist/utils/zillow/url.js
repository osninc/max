"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildZillowUrl = exports.zoomParams = void 0;
const atom_1 = require("./atom");
const baseUrl = 'https://www.zillow.com/';
const baseParams = '?searchQueryState=';
const salePath = '';
const soldPath = 'sold/';
// isForSaleByAgent: { value: false },
// isForSaleByOwner: { value: false },
// isNewConstruction: { value: false },
// isAuction: { value: false },
// isComingSoon: { value: false },
// isForSaleForeclosure: { value: false },
// isRecentlySold: { value: true },
// isAllHomes: { value: true }
exports.zoomParams = {
    zipcode: 12,
    county: 9,
    state: 6
};
const defaultParams = {
    pagination: {},
    isMapVisible: true,
    filterState: {
        sort: { value: 'days' },
        sf: { value: false },
        con: { value: false },
        mf: { value: false },
        manu: { value: false },
        tow: { value: false },
        apa: { value: false },
        apco: { value: false } // Apartment Or condo
    },
    isListVisible: true
};
const soldFilter = {
    fsba: { value: false },
    fsbo: { value: false },
    nc: { value: false },
    cmsn: { value: false },
    auc: { value: false },
    fore: { value: false },
    rs: { value: true },
    ah: { value: true } // All Homes
};
const buildZillowUrl = (status, params, searchType) => {
    const locationPath = (0, atom_1.convertArea4Zillow)(params, searchType);
    // Reformat the param list
    let newParams = {
        ...defaultParams,
        usersSearchTerm: params.usersSearchTerm,
        mapBounds: params.mapBounds,
        regionSelection: params.regionSelection,
        filterState: {
            ...defaultParams.filterState,
            doz: { ...params.filterState.doz },
            lot: { ...params.filterState.lotSize }
        },
        mapZoom: exports.zoomParams[searchType.toLowerCase()]
    };
    if (status === 'Sold') {
        newParams = {
            ...newParams,
            filterState: {
                ...newParams.filterState,
                ...soldFilter
            }
        };
    }
    const finalPath = `${baseUrl}${locationPath}/${status === 'Sold' ? soldPath : salePath}${baseParams}${encodeURIComponent(JSON.stringify(newParams))}`;
    return finalPath;
};
exports.buildZillowUrl = buildZillowUrl;
//# sourceMappingURL=url.js.map