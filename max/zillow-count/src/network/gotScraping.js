import { gotScraping } from "got-scraping";
import { zillow } from "../constants/zillow.js";

import { randomHeaders } from "./shared/headers.js";
import { getRandomInt } from "../functions.js";
import { getProxy } from "./shared/proxy.js";
import { getMapBoundsFromHtml } from "./shared/map.js";
import { transformData } from "./shared/data.js";


export const getProxyUrl = async (proxy) => {
    const proxyUrl = await getProxy(proxy);
    return proxyUrl;
}

export const getLocationData = async (searchType, proxy, q, nameForUrl) => {
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

export const getSearchData = async (searchQueryState, refererUrl, proxy) => {
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


