import axios from "axios-https-proxy-fix";
import { defaultHeaders } from "./headers.js";
import { zillow } from "./zillow.js";
import { getRandomInt } from "../functions.js";
import { Actor } from "apify";
import { processError } from "../error.js";

const axiosDefaults = {
    timeout: 30000
}

const transformData = data => {
    return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

const getProxyUrl = async (proxy) => {
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

export const getLocationData = async (searchType, proxy, q) => {
    let finalConfig = {
        headers: {
            ...defaultHeaders,
            Referer: "https://www.zillow.com/",
            "Referrer-Policy": "unsafe-url"
        },
        params: { q },
        ...axiosDefaults
    }

    if (proxy !== "none") {
        const proxyUrl = await getProxyUrl(proxy);
        finalConfig = {
            ...finalConfig,
            rejectUnauthorized: false,
            proxy: proxyUrl
        }
    }

    console.log({ finalConfig })

    const response = await axios.get(zillow.url.region, finalConfig);
    console.log({ response })
    const data = response.data.results;

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
        mapBounds: returnBounds,
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

    let finalConfig = {
        headers: {
            ...defaultHeaders,
            Referer: refererUrl,
            "Referrer-Policy": "unsafe-url",
        },
        params: {
            searchQueryState,
            wants: zillow.wants,
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
}


