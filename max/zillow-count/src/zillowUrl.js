const baseUrl = "https://www.zillow.com/";
const baseParams = "?searchQueryState=";
const salePath = "";
const soldPath = "sold/"

// isForSaleByAgent: { value: false },
// isForSaleByOwner: { value: false },
// isNewConstruction: { value: false },
// isAuction: { value: false },
// isComingSoon: { value: false },
// isForSaleForeclosure: { value: false },
// isRecentlySold: { value: true },
// isAllHomes: { value: true }

const defaultParams = {
    pagination: {},
    usersSearchTerm: "Los Angeles County CA",
    mapBounds: {
        "west": -120.3915580078125,
        "east": -116.2057669921875,
        "south": 32.29414671208308,
        "north": 35.265851386057676
    },
    "regionSelection": [{ "regionId": 3101, "regionType": 4 }],
    "isMapVisible": true,
    "filterState": {
        "doz": { "value": "7" },
        "sort": { "value": "days" },
        "fsba": { "value": false },
        "fsbo": { "value": false },
        "nc": { "value": false },
        "fore": { "value": false },
        "cmsn": { "value": false },
        "auc": { "value": false },
        "rs": { "value": true },
        "ah": { "value": true },
        "sf": { "value": false },
        "con": { "value": false },
        "mf": { "value": false },
        "manu": { "value": false },
        "tow": { "value": false },
        "apa": { "value": false },
        "apco": { "value": false },
        "lot": { "min": 1000, "max": 2000 }
    },
    "isListVisible": true,
    "mapZoom": 8
}

export const buildZillowUrl = (params) => {
    
}