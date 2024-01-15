import { convertArea4Zillow } from './atom'

const baseUrl = 'https://www.zillow.com/'
const baseParams = '?searchQueryState='
const salePath = ''
const soldPath = 'sold/'

// isForSaleByAgent: { value: false },
// isForSaleByOwner: { value: false },
// isNewConstruction: { value: false },
// isAuction: { value: false },
// isComingSoon: { value: false },
// isForSaleForeclosure: { value: false },
// isRecentlySold: { value: true },
// isAllHomes: { value: true }

export const zoomParams: any = {
    zipcode: 12,
    county: 9,
    state: 6
}

const defaultParams = {
    pagination: {},
    isMapVisible: true,
    filterState: {
        sort: { value: 'days' },
        sf: { value: false }, // single family home
        con: { value: false }, // is condo
        mf: { value: false }, // multi family
        manu: { value: false }, // manufacture
        tow: { value: false }, // Townhouse
        apa: { value: false }, // Apartment
        apco: { value: false } // Apartment Or condo
    },
    isListVisible: true
}

const soldFilter = {
    fsba: { value: false }, // For Sale By Agent
    fsbo: { value: false }, // For Sale By Owner
    nc: { value: false }, // New Construction
    cmsn: { value: false }, // Coming Soon
    auc: { value: false }, // Auction
    fore: { value: false }, // Foreclosure
    rs: { value: true }, // Recently Sold
    ah: { value: true } // All Homes
}

export const buildZillowUrl = (status: string, params: any, searchType: string) => {
    const locationPath = convertArea4Zillow(params, searchType)

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
        mapZoom: zoomParams[searchType.toLowerCase()]
    }

    if (status === 'Sold') {
        newParams = {
            ...newParams,
            filterState: {
                ...newParams.filterState,
                ...soldFilter
            }
        }
    }

    const finalPath = `${baseUrl}${locationPath}/${
        status === 'Sold' ? soldPath : salePath
    }${baseParams}${encodeURIComponent(JSON.stringify(newParams))}`

    return finalPath
}
