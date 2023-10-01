import axios from "axios-https-proxy-fix";
import { Actor } from "apify";
import { getTestRegion, getTestData } from "./usingTest.js";
import { alphaNum, getRandomInt } from "./functions.js";
import { processError } from "./error.js";
import { gotScraping } from "got-scraping";
import * as cheerio from 'cheerio';

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

const getMapBoundsFromHtml = body => {
    const $ = cheerio.load(body);

    const findTextAndReturnRemainder = (target, variable) => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length);
        const result = chopFront.substring(0, chopFront.search(";"));
        return result;
    }

    const text = $($('script')).text();
    console.log({text})
    const findAndClean = findTextAndReturnRemainder(text, "window.mapBounds = ");
    console.log({ findAndClean })
    const result = JSON.parse(findAndClean);
    return result;
}


const transformData = data => {
    return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

export const getProxyUrl = async (proxy) => {
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

export const getLocationInfo = async (searchType, search, proxy, isTest) => {
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

    const url = 'https://www.zillowstatic.com/autocomplete/v3/suggestions';

    const scrapMapBoundsUrl = `https://www.zillow.com/homes/${nameForUrl}_rb/`


    if (isTest) {
        return getTestRegion(regionType);
    }
    else {
        try {
            let finalConfig = { headers: defaultHeaders, params: { q: search }, ...axiosDefaults }

            let scrapingConfig = {
                url: scrapMapBoundsUrl,
                headerGeneratorOptions: {
                    browsers: [
                        {
                            name: 'chrome',
                            minVersion: 87,
                            maxVersion: 89
                        }
                    ],
                    devices: ['desktop'],
                    locales: ['de-DE', 'en-US'],
                    operatingSystems: ['windows', 'linux'],
                }
            }


            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy)
                finalConfig = {
                    ...finalConfig,
                    rejectUnauthorized: false,
                    proxy: proxyUrl
                }

                scrapingConfig = {
                    ...scrapingConfig,
                    proxyUrl: proxyUrl
                }
            }

            const response1 = await gotScraping(scrapingConfig);
            const body = response1.body;
            const finalMapBounds = getMapBoundsFromHtml(body);

            const response = await axios.get(url, finalConfig);
            const data = response.data.results;

            // Only get the result of the county regionType
            const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === searchType.toLowerCase());

            const { regionId } = regionResults[0].metaData;
            let extraMeta = {}

            // If it's a zipcode, need the city and state name
            if (searchType.toLowerCase() === "zipcode")
                extraMeta = {
                    cityState: `${regionResults[0].metaData.city.replace(/\ /gi, "-").toLowerCase()}-${regionResults[0].metaData.state}`.toLowerCase()
                }

            // const offset = 10;

            //console.log({finalMapBounds})

            const obj = {
                mapBounds: finalMapBounds,
                regionSelection: [
                    {
                        regionId,
                        regionType
                    }
                ],
                ...extraMeta
            }

            return obj

        } catch (error) {
            processError("getLocationInfo", error);
            return {}
        }
    }
}

export const getSearchResults = async (searchQueryState, refererUrl, proxy, isTest) => {
    const url = "https://www.zillow.com/search/GetSearchPageState.htm";

    const wants = {
        cat1: ["mapResults"],
        cat2: ["total"],
        regionResults: ["regionResults"]
    };
    const requestId = getRandomInt(20);

    if (isTest) {
        return transformData(getTestData());
    }
    else {

        try {
            let finalConfig = {
                headers: {
                    ...defaultHeaders,
                    Referer: refererUrl,
                    "Referrer-Policy": "unsafe-url",
                },
                params: {
                    searchQueryState,
                    wants,
                    requestId
                },
                responseType: "json",
                ...axiosDefaults
            }

            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy);
                finalConfig = {
                    ...finalConfig,
                    proxy: proxyUrl,
                    rejectUnauthorized: false
                }
            }

            const response = await axios.get(url, finalConfig);
            const data = response.data;

            return transformData(data)
            //return { count: 0 }


        } catch (error) {
            processError("getSearchResults", error);
            return { count: "N/A" }
        }
    }
}

