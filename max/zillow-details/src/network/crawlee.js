import { BasicCrawler, Dataset, Configuration } from 'crawlee';
import { defaultHeaders, randomHeaders } from "./shared/headers.js";
import { zillow } from "../constants/zillow.js";
import { getRandomInt } from "../functions.js";
import { getProxy } from "./shared/proxy.js";
import { getMapBoundsFromHtml } from "./shared/map.js";
import { transformData } from './shared/data.js';
import { getState } from '../state.js';

export const getProxyUrl = async (proxy) => {
    const proxyUrl = await getProxy(proxy);
    return proxyUrl;
}

export const getLocationData = async (searchType, proxy, q, nameForUrl) => {
    // build URL
    const url = zillow.url.mapBound.replace("INSERT-NAME-HERE", nameForUrl)

    let baseConfig = {
       // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            Referer: "https://www.zillow.com/",
            "Referrer-Policy": "unsafe-url"
        },
        searchParams: { q }
    }

    const mapBoundsConfig = {
        ...baseConfig,
        url
    }

    const regionConfig = {
        ...baseConfig,
        url: zillow.url.region,
        responseType: "json"
    }

    let returnObj = {}

    const crawler = new BasicCrawler({
        async requestHandler({ request, sendRequest }) {
            // Build the request
            let defaultRequest = {
                url: request.url,
                method: request.method,
                body: request.payload,
                headers: request.headers,
                //headerGeneratorOptions: { ...randomHeaders }
            }
            let finalRequest;

            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy);
                defaultRequest = {
                    ...defaultRequest,
                    proxyUrl
                }
            }

            if (request.url === url) {
                finalRequest = {
                    ...defaultRequest
                }
            }
            if (request.url === zillow.url.region) {
                finalRequest = {
                    ...defaultRequest,
                    responseType: "json",
                    searchParams: { q }
                }
            }

            // 'request' contains an instance of the Request class
            // Here we simply fetch the HTML of the page and store it to a dataset
            const { body } = await sendRequest(finalRequest);

            if (request.url === url) {
                const finalMapBounds = getMapBoundsFromHtml(body);
                returnObj = {
                    ...returnObj,
                    mapBounds: finalMapBounds
                }
            }

            if (request.url === zillow.url.region) {
                const data = body.results;

                // Only get the result of the county regionType
                const regionResults = data.filter(d => d.metaData?.regionType?.toLowerCase() === searchType.toLowerCase());

                const { regionId, lat, lng } = regionResults[0].metaData;
                let extraMeta = {}

                // If it's a zipcode, need the city and state name
                if (searchType.toLowerCase() === "zipcode")
                    extraMeta = {
                        cityState: `${regionResults[0].metaData.city.replace(/\ /gi, "-").toLowerCase()}-${regionResults[0].metaData.state}`.toLowerCase()
                    }

                if (!returnObj.mapBounds) {
                    const offset = 10;

                    extraMeta = {
                        ...extraMeta,
                        mapBounds: {
                            north: lat + offset,
                            south: lat - offset,
                            west: lng - offset,
                            east: lng + offset
                        }
                    }
                }

                returnObj = {
                    ...returnObj,
                    regionSelection: [
                        {
                            regionId
                        }
                    ],
                    ...extraMeta
                }
            }
        }
    });

    await crawler.run([
        mapBoundsConfig,
        regionConfig
    ]);

    return returnObj;
}

export const getSearchData = async (searchQueryState, refererUrl, proxy) => {
    const url = zillow.url.search;
    const requestId = getRandomInt(20);

    let returnObj = {
        url,
        headerGeneratorOptions: { ...randomHeaders },
        headers: {
            Referer: refererUrl,
            "Referrer-Policy": "unsafe-url",
        },
        responseType: "json",
        searchParams: {
            searchQueryState: encodeURIComponent(JSON.stringify(searchQueryState)),
            wants: encodeURIComponent(JSON.stringify(zillow.wants)),
            requestId
        }
    }
    if (proxy !== "none") {
        const proxyUrl = await getProxyUrl(proxy);
        scrapingConfig = {
            ...scrapingConfig,
            proxyUrl
        }
    }
    return returnObj;
}

export const processAryOfUrls = async (urls, proxy, ts) => {
    let newData = [];

    const crawler = new BasicCrawler({
        async requestHandler({request,sendRequest}) {
            //console.log(request.userData)
            // Build the request
            let defaultRequest = {
                url: request.url,
                method: request.method,
                body: request.payload,
                headers: request.headers,
                responseType: "json"
            }
            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy);
                defaultRequest = {
                    ...defaultRequest,
                    proxyUrl
                }
            }

            let startTime, endTime;
            startTime = performance.now();
            const { body } = await sendRequest(defaultRequest);
            endTime = performance.now();
            let returnObj = transformData(body);

            const searchByText = (request.userData.searchBy === "state") ? getState(request.userData.realSearch) : request.userData.realSearch;
            const daysKey = (request.userData.status === "Sold") ? "soldInLast" : "daysOnZillow";

            const blankFields = {
                county: "",
                state: "",
                zipCode: "",
                soldInLast: "",
                daysOnZillow: ""
            }

            const finalResults = {
                ...blankFields,
                [request.userData.searchBy]: searchByText,
                timeStamp: ts.toString(),
                status: request.userData.status,
                [daysKey]: request.userData.timeDim,
                acreage: request.userData.lotSize,
                url: request.userData.linkUrl,
                timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
                proxy,
                scraper: "crawlee",
                ...returnObj
            }

            newData = [
                ...newData,
                finalResults
            ];
        }
    })
    await crawler.run(urls);

    return newData;

}

export const createCrawleeObj = (searchParams, refererUrl, searchBy, status, lot, t) => {
    const requestId = getRandomInt(20);

    const zUrl = `${zillow.url.search}?searchQueryState=${encodeURIComponent(JSON.stringify(searchParams))}&wants=${encodeURIComponent(JSON.stringify(zillow.wants))}&requestId=${requestId}`;
    
    const requestObj = {
        url: zUrl,
        headers: {
            Referer: refererUrl,
            "Referrer-Policy": "unsafe-url",
        },
        responseType: "json",
        userData: {
            searchBy,
            status,
            linkUrl: refererUrl,
            realSearch: searchParams.usersSearchTerm,
            lotSize: lot,
            timeDim: t
        }
    }
    return requestObj;

}


