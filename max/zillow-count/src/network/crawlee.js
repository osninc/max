import axios from "axios-https-proxy-fix";
import { defaultHeaders } from "./shared/headers.js";
import { zillow } from "../constants/zillow.js";
import { getRandomInt } from "../functions.js";
import { getProxy } from "./shared/proxy.js";
import { getMapBoundsFromHtml } from "./shared/map.js";

const getProxyUrl = async (proxy) => {
    const proxyUrl = await getProxy(proxy);
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

export const getLocationData = async (searchType, proxy, q, nameForUrl) => {
    let finalConfig = {
        headers: {
            ...defaultHeaders,
            Referer: "https://www.zillow.com/",
            "Referrer-Policy": "unsafe-url"
        },
        params: { q },
        ...axiosDefaults
    }

    // build URL
    const url = zillow.url.mapBound.replace("INSERT-NAME-HERE", nameForUrl)

    if (proxy !== "none") {
        const proxyUrl = await getProxyUrl(proxy);
        finalConfig = {
            ...finalConfig,
            rejectUnauthorized: false,
            proxy: proxyUrl
        }
    }

    const response1 = await axios.get(url, finalConfig);
    const body = response1.data;
    const finalMapBounds = getMapBoundsFromHtml(body);

    const response = await axios.get(zillow.url.region, finalConfig);
    //console.log({ response })
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


