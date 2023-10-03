import axios from "axios-https-proxy-fix";
import { Actor } from "apify";
import { getTestRegion, getTestData } from "./usingTest.js";
import { alphaNum, getRandomInt } from "./functions.js";
import { processError } from "./error.js";
import { gotScraping } from "got-scraping";
import * as cheerio from 'cheerio';
import { getLocationData as axiosGetLocationData, getSearchData as axiosGetSearchData } from "./network/axios.js";
import { getLocationData as gotGetLocationData, getSearchData as gotGetSearchData } from "./network/gotScraping.js";
import { zillow } from "./network/zillow.js";

const COUNTY = 4;
const ZIPCODE = 7;
const CITY = 6;
const STATE = 2;

const axiosDefaults = {
    timeout: 30000
}

const defaultHeaders = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1',
    "x-requested-with": "XMLHttpRequest",
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
    "sec-ch-ua":
        '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
}

const randomHeaders = {
    devices: ['mobile', 'desktop'],
    locales: ['en-US'],
    operatingSystems: ['windows', 'macos', 'android', 'ios', 'linux'],
    browsers: [{
        name: 'chrome',
        minVersion: 87,
        maxVersion: 89
    }, 'edge', 'firefox', 'safari'],
}

// const getMapBoundsFromHtml = body => {
//     const $ = cheerio.load(body);

//     const findTextAndReturnRemainder = (target, variable) => {
//         const chopFront = target.substring(target.search(variable) + variable.length, target.length);
//         const result = chopFront.substring(0, chopFront.search(";"));
//         return result;
//     }

//     const text = $($('script')).text();
//     const findAndClean = findTextAndReturnRemainder(text, "window.mapBounds = ");
//     //console.log({ text });
//     // console.log({ findAndClean })
//     try {
//         const result = JSON.parse(findAndClean);
//         return result;
//     } catch (error) {
//         console.log({ text });
//         console.log({ findAndClean })
//         const l = findTextAndReturnRemainder(text, "var pxCaptchaSrc = ");
//         processError("findTextAndReturnRemainder", error);
//         throw new Error(l)
//     }

// }


// const transformData = data => {
//     return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
// }

export const getProxyUrl4Axios = async (proxy) => {
    const groups = (proxy === "residential") ? { groups: ["RESIDENTIAL"] } : {};
    const proxyConfiguration = await Actor.createProxyConfiguration(groups);
    // Example http://bob:password123@proxy.example.com:8000
    const proxyUrl = await proxyConfiguration.newUrl();
    const urlObj = new URL(proxyUrl);
    const obj = {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname,
        port: urlObj.port,
        auth: {
            username: urlObj.username,
            password: process.env.APIFY_PROXY_PASSWORD
        }
    }

    return obj;
}

export const getProxyUrl = async (proxy) => {
    const groups = (proxy === "residential") ? { groups: ["RESIDENTIAL"] } : {};
    const proxyConfiguration = await Actor.createProxyConfiguration(groups);
    // Example http://bob:password123@proxy.example.com:8000
    const proxyUrl = await proxyConfiguration.newUrl();

    return proxyUrl;
}

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
    let regionType = COUNTY;
    switch (searchType.toLowerCase()) {
        case "zipcode":
            regionType = ZIPCODE;
            break;
        case "state":
            regionType = STATE;
            break;
        case "city":
            nameForUrl = alphaNum(search).replace(/\ /gi, "-").toLowerCase();
            regionType = CITY;
            break;
        default:
            nameForUrl = alphaNum(search).replace(/\ /gi, "-").toLowerCase();
            break;
    }

    if (isTest) {
        return getTestRegion(regionType);
    }
    else {
        try {
            let data;
            switch (scraper) {
                case "axios":
                    data = await axiosGetLocationData(searchType, proxy, search)
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
