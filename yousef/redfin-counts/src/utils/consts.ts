export const PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['searchUrl', 'query', 'region', 'status', 'lot', 'time']

export const DESTINATION = {
    LOCATION: 'LOCATION',
    SEARCH: 'SEARCH'
}

export const REQUEST_HANDLER = {
    AXIOS: 'AXIOS',
    GOT: 'GOT',
    CRAWLEE_GOT: 'CRAWLEE_GOT'
}

export const PROXY_TYPE = {
    APIFY_RESIDENTIAL: 'apify-residential',
    SMARTPROXY_RESIDENTIAL: 'smartproxy-residential',
    NONE: 'none'
}

export const WEBSITE = {
    URL: {
        LOCATION:
            'https://www.redfin.com/stingray/do/location-autocomplete?location=QUERY&start=0&count=10&v=2&market=philadelphia&al=1&iss=false&ooa=true&mrs=false&region_id=NaN&region_type=NaN&lat=40.073040000000006&lng=-74.72432500000001'
        // SEARCH: ''
    },
    WANTS: {
        cat1: ['mapResults' /* , 'listResults' */],
        cat2: ['total']
        // regionResults: ['regionResults']
    },
    REGION_TYPE: {
        county: 5,
        zipcode: 2,
        city: 6,
        state: 4
    }
}

export const STATUS_MATRIX = ['For Sale', 'Sold']

export const FOR_SALE_TIME_MATRIX = [
    ['1-', '1 Day'],
    ['3-', 'Less than 3 days'],
    ['7-', 'Less than 7 days'],
    ['14-', 'Less than 14 days'],
    ['30-', 'Less than 30 days']
    // ["-7", "More than 7 days"],
    // ["-14", "More than 14 days"],
    // ["-30", "More than 30 days"],
    // ["-45", "More than 45 days"],
    // ["-60", "More than 60 days"],
    // ["-90", "More than 90 days"]
]

export const SOLD_TIME_MATRIX = [
    ['7', 'Last 1 week'],
    ['30', 'Last 1 month'],
    ['90', 'Last 3 months'],
    ['180', 'Last 6 months'],
    ['365', 'Last 1 year'],
    ['730', 'Last 2 years'],
    ['1095', 'Last 3 years'],
    ['1825', 'Last 5 years']
]

export const LOT_SIZE = [
    ['', '2000'],
    ['2000', '4500'],
    ['4500', '6500'],
    ['6500', '8000'],
    ['8000', '9500'],
    ['9500', '10890'],
    ['10890', '21780'],
    ['21780', '43560'],
    ['43560', '87120'],
    ['87120', '130680'],
    ['130680', '174240'],
    ['174240', '217800'],
    ['217800', '435600'],
    ['435600', '871200'],
    ['871200', '1742400'],
    ['1742400', '4356000'],
    ['4356000', ''],
    ['', '']
]

export const FOR_SALE_TIME_FOR_URL = {
    '1-': '1d',
    '3-': '3d',
    '7-': '1wk',
    '14-': '2wk',
    '30-': '1mo'
}

export const SOLD_TIME_FOR_URL = {
    '7': '1-wk',
    '30': '1mo',
    '90': '2mo',
    '180': '3mo',
    '365': '1-yr',
    '730': '2-yr',
    '1095': '3-yr',
    '1825': '5-yr'
}

export const LOT_SIZE_FOR_URL = {
    '2000': '2k-sqft',
    '4500': '4.5k-sqft',
    '6500': '6.5k-sqft',
    '8000': '8k-sqft',
    '9500': '9.5k-sqft',
    '10890': '0.25-acre',
    '21780': '0.5-acre',
    '43560': '1-acre',
    '87120': '2-acre',
    '130680': '3-acre',
    '174240': '4-acre',
    '217800': '5-acre',
    '435600': '10-acre',
    '871200': '20-acre',
    '1742400': '40-acre',
    '4356000': '100-acre'
}
export const OUTPUT_FIELDS = {
    ACREAGE: 'acreage'
}

export const DEFAULT_OUTPUT = {
    county: '',
    state: '',
    zipCode: '',
    soldInLast: '',
    daysOnZillow: ''
}

export const START_TIMESTAMP = new Date().toString()
