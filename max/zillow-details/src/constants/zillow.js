export const zillow = {
    url: {
        region: 'https://www.zillowstatic.com/autocomplete/v3/suggestions',
        mapBound: "https://www.zillow.com/homes/INSERT-NAME-HERE_rb/",
        search: "https://www.zillow.com/search/GetSearchPageState.htm",
        details: "https://www.zillow.com/graphql"
    },
    wants: {
        cat1: ["listResults"],
        cat2: ["total"],
        regionResults: ["regionResults"]
    },
    regionType: {
        county: 4,
        zipcode: 7,
        city: 6,
        state: 2
    }
}

// const COUNTY = 4;
// const ZIPCODE = 7;
// const CITY = 6;
// const STATE = 2;