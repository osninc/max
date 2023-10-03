import { gotScraping } from "got-scraping";
import * as cheerio from 'cheerio';
import { zillow } from "./zillow.js";

import { randomHeaders } from "./headers.js";
import { getRandomInt } from "../functions.js";
import { processError } from "../error.js";
import { Actor } from "apify";

const transformData = data => {
    return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

const getMapBoundsFromHtml = body => {
    const $ = cheerio.load(body);

    const findTextAndReturnRemainder = (target, variable) => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length);
        const result = chopFront.substring(0, chopFront.search(";"));
        return result;
    }

    const text = $($('script')).text();
    const findAndClean = findTextAndReturnRemainder(text, "window.mapBounds = ");
    //console.log({ text });
    // console.log({ findAndClean })
    try {
        const result = JSON.parse(findAndClean);
        return result;
    } catch (error) {
        console.log({ text });
        console.log({ findAndClean })
        const l = findTextAndReturnRemainder(text, "var pxCaptchaSrc = ");
        processError("findTextAndReturnRemainder", error);
        throw new Error(l)
    }

}


export const getProxyUrl = async (proxy) => {
    const groups = (proxy === "residential") ? { groups: ["RESIDENTIAL"] } : {};
    const proxyConfiguration = await Actor.createProxyConfiguration(groups);
    // Example http://bob:password123@proxy.example.com:8000
    const proxyUrl = await proxyConfiguration.newUrl();

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
    let response1, body, finalMapBounds;
    response1 = await gotScraping({
        ...finalConfig,
        url
    });
    body = response1.body;
    finalMapBounds = getMapBoundsFromHtml(body);

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


