export const zillow = {
    url: {
        region: 'https://www.zillowstatic.com/autocomplete/v3/suggestions',
        mapBound: "https://www.zillow.com/homes/INSERT-NAME-HERE_rb/",
        search: "https://www.zillow.com/search/GetSearchPageState.htm"
    },
    wants: {
        cat1: ["mapResults"],
        cat2: ["total"],
        regionResults: ["regionResults"]
    }
}