import { gotScraping } from "got-scraping";
import { zillow } from "../constants/zillow.js";

import { randomHeaders } from "./shared/headers.js";
import { getRandomInt } from "../functions.js";
import { getProxy } from "./shared/proxy.js";
import { getMapBoundsFromHtml } from "./shared/map.js";
import { transformData } from "./shared/data.js";
import { processError } from "../error.js";
import { getTestRegion, getTestData } from "../usingTest.js";
import { getCountInfo } from "../network.js";

const USETEST = false;

export const getProxyUrl = async (proxy) => {
    const proxyUrl = await getProxy(proxy);
    return proxyUrl;
}

export const getLocationData = async (searchType, proxy, q, nameForUrl) => {
    if (USETEST) {
        return getTestRegion(searchType)
    }
    else {
        let finalConfig = {
            headerGeneratorOptions: { ...randomHeaders },
            headers: {
                Referer: "https://www.zillow.com/",
                "Referrer-Policy": "unsafe-url",
            },
        }

        // build URL
        const url = zillow.url.mapBound.replace("INSERT-NAME-HERE", nameForUrl)

        if (proxy !== "none") {
            const proxyUrl = await getProxyUrl(proxy);

            finalConfig = {
                ...finalConfig,
                proxyUrl
            }
        }

        const response1 = await gotScraping({
            ...finalConfig,
            url
        });
        const body = response1.body;
        const finalMapBounds = getMapBoundsFromHtml(body);

        const response = await gotScraping(
            {
                ...finalConfig,
                searchParams: { q },
                url: zillow.url.region,
                responseType: "json"
            }
        )

        const data = response.body.results;

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
        return {
            mapBounds: finalMapBounds ? finalMapBounds : returnBounds,
            regionSelection: [
                {
                    regionId
                }
            ],
            ...extraMeta
        }
    }
}

export const getSearchData = async (searchQueryState, refererUrl, proxy) => {
    const url = zillow.url.search;

    const requestId = getRandomInt(20);

    let finalArray = [];

    let searchParams;

    if (USETEST) {
        const testLarge = getTestData();
        // Check for paging
        const pagingInfo = getCountInfo(testLarge);

        Array.from({ length: pagingInfo.totalPages }, (_, i) => i + 1).map(x => {
            // Modify search params to have pagination info
             searchParams = {
                ...searchQueryState,
                pagination: { currentPage: x }
            }

            finalArray = [
                ...finalArray,
                ...transformData(testLarge)
            ]
        })
        return finalArray;
    }
    else {

        try {
            let scrapingConfig = {
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

            //console.log({scrapingConfig})

            const response = await gotScraping(scrapingConfig)
            const data = response.body;

            // Check to see if there are pages of data

            // Check for paging
            const pagingInfo = getCountInfo(data);

            finalArray = [
                ...finalArray,
                ...transformData(data)
            ]

            if (pagingInfo.totalPages > 1) {
                //console.log("I'm passed paging")
                //
                await Promise.all(Array.from({ length: pagingInfo.totalPages }, (_, i) => i + 1).map(async x => {
                    if (x === 1) return;

                    // if (debug) {
                    //     console.log("LINE 303:")
                    //     console.log({ x })
                    // }
                    // Modify search params to have pagination info
                    searchParams = {
                        ...searchQueryState,
                        pagination: { currentPage: x }
                    }

                    //console.log({ searchParams })
                    // finalConfig = {
                    //     ...finalConfig,
                    //     params: {
                    //         ...finalConfig.params,
                    //         searchQueryState: searchQueryState,
                    //         requestId: x
                    //     }
                    // }
                    scrapingConfig = {
                        ...scrapingConfig,
                        searchParams: {
                            searchQueryState: encodeURIComponent(JSON.stringify(searchParams)),
                            wants: encodeURIComponent(JSON.stringify(zillow.wants)),
                            requestId: x
                        }
                    }

                    //console.log({ scrapingConfig })

                    //console.log(JSON.stringify(scrapingConfig))

                    // if (debug) {
                    //     console.log("LINE 321: ")
                    //     console.log(JSON.stringify(finalConfig))
                    // }

                    const response2 = await gotScraping(scrapingConfig) //axios.get(url, finalConfig);
                    const data2 = response2.body;
                    //console.log({ response2 })


                    finalArray = [
                        ...finalArray,
                        ...transformData(data2)
                    ]

                    // if (debug) {
                    //     console.log("LINE 334: ")
                    //     console.log({ finalArray })
                    // }
                }))
                return finalArray
            }
            else {
                return transformData(data)
            }
        } catch (error) {
            processError("getSeatchData", error)
        }
    }
}

export const getSearchData2 = async (searchQueryState, refererUrl, proxy) => {
    const url = zillow.url.search;

    const requestId = getRandomInt(20);

    let scrapingConfig = {
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

    const response = await gotScraping(scrapingConfig)
    const data = response.body;

    return transformData(data)

}


