//import axios from "axios-https-proxy-fix";
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

const USESCRAPER = true;

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
    operatingSystems: ['windows', 'macos', 'android', 'ios'],
    browsers: ['chrome', 'edge', 'firefox', 'safari'],
}

const getMapBoundsFromHtml = body => {
    const $ = cheerio.load(body);

    const findTextAndReturnRemainder = (target, variable) => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length);
        const result = chopFront.substring(0, chopFront.search(";"));
        return result;
    }

    const text = $($('script')).text();
    //console.log({ text })
    const findAndClean = findTextAndReturnRemainder(text, "window.mapBounds = ");
    //console.log({ findAndClean })
    const result = JSON.parse(findAndClean);
    return result;
}


const transformData = data => {
    return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

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
                headerGeneratorOptions: {...randomHeaders},
                headers: {
                    Referer: "https://www.zillow.com/",
                    "Referrer-Policy": "unsafe-url",
                }
            }


            if (proxy !== "none") {
                const proxyUrl4Axios = await getProxyUrl4Axios(proxy);
                const proxyUrl = await getProxyUrl(proxy);
                finalConfig = {
                    ...finalConfig,
                    rejectUnauthorized: false,
                    proxy: proxyUrl4Axios
                }

                scrapingConfig = {
                    ...scrapingConfig,
                    proxyUrl
                }
            }

            let response1, body, finalMapBounds;
            if (USESCRAPER) {
                response1 = await gotScraping(scrapingConfig);
                //console.log({ scrapingConfig })
                body = response1.body;
                finalMapBounds = getMapBoundsFromHtml(body);
            }

            //const response = await axios.get(url, finalConfig);
            const response = await gotScraping(
                {
                    ...scrapingConfig,
                    searchParams: { q: search },
                    url,
                    responseType: "json"
                }
            )
            //console.log({response})
            //const data = response.data.results;
            const data = response.body.results;

            //console.log(JSON.stringify(data))

            // Only get the result of the county regionType
            const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === searchType.toLowerCase());

            const { regionId, lat, lng } = regionResults[0].metaData;
            let extraMeta = {}

            // If it's a zipcode, need the city and state name
            if (searchType.toLowerCase() === "zipcode")
                extraMeta = {
                    cityState: `${regionResults[0].metaData.city.replace(/\ /gi, "-").toLowerCase()}-${regionResults[0].metaData.state}`.toLowerCase()
                }

            const offset = 10;

            const returnBounds = {
                north: lat + offset,
                south: lat - offset,
                west: lng - offset,
                east: lng + offset
            }

             //console.log({ finalMapBounds })
            // console.log({ returnBounds })


            const obj = {
                mapBounds: finalMapBounds ? finalMapBounds : returnBounds,
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

            let scrapingConfig = {
                url: url,
                headerGeneratorOptions: { ...randomHeaders },
                headers: {
                    Referer: refererUrl,
                    "Referrer-Policy": "unsafe-url",
                },
                responseType: "json",
                searchParams: {
                    searchQueryState: encodeURIComponent(JSON.stringify(searchQueryState)),
                    wants: encodeURIComponent(JSON.stringify(wants)),
                    requestId
                }
            }

            // let scrapingConfig = {
            //     headers: {
            //     //     ...defaultHeaders,
            //         Referer: refererUrl,
            //         "Referrer-Policy": "unsafe-url",
            //     },
            //     headerGeneratorOptions: { ...randomHeaders },
            //     responseType: "json",
            //     url
            // }

            if (proxy !== "none") {
                const proxyUrl4Axios = await getProxyUrl4Axios(proxy);
                const proxyUrl = await getProxyUrl(proxy);
                finalConfig = {
                    ...finalConfig,
                    proxy: proxyUrl4Axios,
                    rejectUnauthorized: false
                }
                scrapingConfig = {
                    ...scrapingConfig,
                    proxyUrl
                }
                
            }

            //const response = await axios.get(url, finalConfig);
            //const data = response.data;

            // const obj = {
            //     ...scrapingConfig,
            //     searchParams: {
            //         searchQueryState,
            //         wants,
            //         requestId
            //     },
            //     url
            // }

            //console.log(JSON.stringify(obj))


            //console.log({ scrapingConfig })
            const response = await gotScraping(scrapingConfig)
            //console.log({response2})
            const data = response.body;

            return transformData(data)
            //return { count: 0 }


        } catch (error) {
            //console.log(JSON.stringify(error))
            processError("getSearchResults", error);
            return { count: "N/A" }
        }
    }
}

