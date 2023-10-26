export const PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['acres']

export const DESTINATION = {
    LOCATION_MAP_BOUNDS: 'LOCATION_MAP_BOUNDS',
    LOCATION_REGION: 'LOCATION_REGION',
    SEARCH: 'SEARCH'
}

export const REQUEST_HANDLER = {
    AXIOS: 'AXIOS',
    CRAWLEE_SEND_REQUEST: 'CRAWLEE_SEND_REQUEST'
}

export const ZILLOW = {
    URL: {
        REGION: 'https://www.zillowstatic.com/autocomplete/v3/suggestions',
        MAP_BOUND: 'https://www.zillow.com/homes/NAME_rb/',
        // search: "https://www.zillow.com/async-create-search-page-state"
        SEARCH: 'https://www.zillow.com/search/GetSearchPageState.htm'
    },
    WANTS: {
        cat1: ['mapResults', 'listResults'],
        cat2: ['total']
        // regionResults: ['regionResults']
    },
    REGION_TYPE: {
        county: 4,
        zipcode: 7,
        city: 6,
        state: 2
    }
}

export const STATUS_MATRIX = ['For Sale', 'Sold']
export const TIME_MATRIX = [
    ['7', '7 Days'],
    ['30', '30 Days'],
    ['90', '90 Days'],
    ['6m', '6 Months'],
    ['12m', '12 Months'],
    ['24m', '24 Months'],
    ['36m', '36 Months']
]
export const LOT_SIZE = [
    ['', '43560'],
    ['43560', '87120'],
    ['87120', '217800'],
    ['217800', '435600'],
    ['435600', '871200'],
    ['871200', '2178000'],
    ['2178000', '4356000'],
    ['4356000', ''],
    ['', '']
]

export const OUTPUT_FIELDS = {
    ACREAGE: 'acreage'
}

export const DEFAULT_OUTPUT = {
    geoSearchType: '',
    county: '',
    state: '',
    zipCode: '',
    soldInLast: '',
    daysOnZillow: ''
}

export const START_TIMESTAMP = new Date().toString()
