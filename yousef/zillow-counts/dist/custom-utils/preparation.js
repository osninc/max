"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareSearchRequests = void 0;
const utils_1 = require("../utils");
const base_utils_1 = require("../base-utils");
const zillow_1 = require("../utils/zillow");
const consts_1 = require("./consts");
const request_1 = require("./request");
const prepareSearchRequests = async (input, log, logInfo, location, userData) => {
    const { searchType } = input;
    const { query, mapBounds, region } = location;
    if (!query || !mapBounds || !region) {
        log.error('Required data is missing:', { ...logInfo, query, mapBounds, region });
        throw new Error('prepareSearchRequests: Required data is missing!');
    }
    let additionalFilters = {};
    let searchParams = {};
    let statusMatrix = [];
    let timeMatrix = [];
    let lotSize = [];
    if (input.isTest) {
        statusMatrix = ['For Sale'];
        timeMatrix = [['36m', '36 months']];
        lotSize = [['', '']];
    }
    else {
        statusMatrix = zillow_1.STATUS_MATRIX;
        timeMatrix = zillow_1.TIME_MATRIX;
        lotSize = zillow_1.LOT_SIZE;
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
    };
    const defaults = {
        pagination: {},
        isMapVisible: true,
        isListVisible: false,
        usersSearchTerm: (0, utils_1.alphaNum)(query),
        mapZoom: 8,
        filterState: {
            sortSelection: { value: 'globalrelevanceex' },
            isLotLand: { value: true },
            isSingleFamily: { value: false },
            isTownhouse: { value: false },
            isMultiFamily: { value: false },
            isCondo: { value: false },
            isApartment: { value: false },
            isManufactured: { value: false },
            isApartmentOrCondo: { value: false }
        }
    };
    let extraMeta = {};
    // If it's a zipcode, need the city and state name
    if (searchType.toLowerCase() === 'zipcode')
        extraMeta = {
            cityState: `${region.city.replace(/ /gi, '-').toLowerCase()}-${region.state}`.toLowerCase()
        };
    if (!mapBounds) {
        const offset = 10;
        extraMeta = {
            ...extraMeta,
            mapBounds: {
                north: region.lat + offset,
                south: region.lat - offset,
                west: region.lng - offset,
                east: region.lng + offset
            }
        };
    }
    const regionParams = {
        regionSelection: [
            {
                regionId: region.id,
                regionType: region.type
            }
        ],
        ...extraMeta
    };
    // @ts-ignore
    // const mapGrids: IMapBounds[] = createCoordinateGrid(mapBounds, 2)
    const searches = [];
    statusMatrix.forEach((status) => {
        additionalFilters = {};
        if (status === 'Sold') {
            additionalFilters = {
                ...soldParams
            };
        }
        timeMatrix.forEach((t) => {
            let timeFilter = {};
            timeFilter = {
                ...timeFilter,
                doz: { value: t[0] }
            };
            lotSize.forEach((lot) => {
                let newFilters = {};
                if (lot[0] !== '') {
                    newFilters = {
                        ...newFilters,
                        lotSize: {
                            min: Number(lot[0])
                        }
                    };
                }
                if (lot[1] !== '') {
                    newFilters = {
                        ...newFilters,
                        lotSize: {
                            ...newFilters.lotSize,
                            max: Number(lot[1])
                        }
                    };
                }
                const searchQueryState = {
                    ...regionParams,
                    mapBounds,
                    ...defaults,
                    mapZoom: zillow_1.zoomParams[searchType.toLowerCase()],
                    filterState: {
                        ...defaults.filterState,
                        ...additionalFilters,
                        ...timeFilter,
                        ...newFilters
                    }
                };
                searchParams = {
                    searchQueryState,
                    wants: zillow_1.ZILLOW.WANTS,
                    requestId: 1
                };
                const searchUrl = (0, zillow_1.buildZillowUrl)(status, searchQueryState, searchType);
                const lotStr = `${(0, utils_1.lotSizeToString)((0, utils_1.sqft2acre)(lot[0]), (0, utils_1.sqft2acre)(lot[1]))}`;
                const extraData = {
                    searchUrl,
                    searchParams,
                    status,
                    lot: lotStr,
                    time: t[1]
                };
                const requestConfig = (0, request_1.getRequestConfig)(consts_1.DESTINATION.SEARCH, input, extraData);
                searches.push({
                    url: searchUrl,
                    requestParams: requestConfig
                });
                // mapGrids.forEach((mapGrid) => {
                //     searchQueryState.mapBounds = mapGrid
                //     const searchUrl = buildZillowUrl(status, searchQueryState, searchType)
                //     const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`
                //     const extraData = {
                //         searchUrl,
                //         searchParams,
                //         status,
                //         lot: lotStr,
                //         time: t[1]
                //     }
                //
                //     const requestConfig = getRequestConfig(DESTINATION.SEARCH, input, extraData)
                //     searches.push({
                //         url: searchUrl,
                //         requestParams: requestConfig
                //     })
                // })
            });
        });
    });
    const searchRequests = searches.map((search) => {
        const { url = '', requestParams = { url }, name, key = url || name } = search;
        return {
            ...requestParams,
            uniqueKey: (0, base_utils_1.getValidKey)(`${consts_1.LABELS.SEARCH}_${key}`),
            userData: {
                ...userData,
                label: consts_1.LABELS.SEARCH,
                search,
                ...search?.requestParams?.userData
            }
        };
    });
    return searchRequests;
};
exports.prepareSearchRequests = prepareSearchRequests;
//# sourceMappingURL=preparation.js.map