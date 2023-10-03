import { getTestRegion } from "./usingTest.js";
import { alphaNum } from "./functions.js";
import { processError } from "./error.js";
import { getLocationData as axiosGetLocationData, getSearchData as axiosGetSearchData } from "./network/axios.js";
import { getLocationData as gotGetLocationData, getSearchData as gotGetSearchData } from "./network/gotScraping.js";
import { zillow } from "./constants/zillow.js";

export const getLocationInfo = async (searchType, search, proxy, isTest, scraper) => {
    /*
        Sample return JSON
        {
        "results": [
            {
                "display": "San Mateo County, CA",
                "resultType": "Region",
                "metaData": {
                    "regionId": 2842,
                    "regionType": "county",
                    "county": "San Mateo County",
                    "countyFIPS": "06081",
                    "state": "CA",
                    "country": "United States",
                    "lat": 37.43620737942326,
                    "lng": -122.35564778392194
                }
            }
        ]
        }
    */

    // Determine regiontype
    let nameForUrl = search;
    let regionType = zillow.regionType[searchType.toLowerCase()];
    if (["city", "county"].includes(searchType.toLowerCase())) {
        nameForUrl = alphaNum(search).replace(/\ /gi, "-").toLowerCase();
    }

    if (isTest) {
        return getTestRegion(regionType);
    }
    else {
        try {
            let data;
            switch (scraper) {
                case "axios":
                    data = await axiosGetLocationData(searchType, proxy, search, nameForUrl)
                    break;
                case "got":
                    data = await gotGetLocationData(searchType, proxy, search, nameForUrl)
                    break;

            }

            const obj = {
                ...data,
                regionSelection: [{ regionId: data.regionSelection[0].regionId, regionType }],
            }

            return obj

        } catch (error) {
            processError("getLocationInfo", error);
            return {
                mapBounds: {
                    north: 0,
                    south: 0,
                    west: 0,
                    east: 0
                },
                regionSelection: {
                    regionId: 0,
                    regionType: 0
                }
            }
        }
    }
}

export const getSearchResults = async (searchQueryState, refererUrl, proxy, isTest, scraper) => {
    try {
        let data;
        switch (scraper) {
            case "axios":
                data = await axiosGetSearchData(searchQueryState, refererUrl, proxy)
                break;
            case "got":
                data = await gotGetSearchData(searchQueryState, refererUrl, proxy)
                break;
        }

        return data;
    } catch (error) {
        //console.log(JSON.stringify(error))
        processError("getSearchResults", error);
        return { count: "N/A" }
    }
}
