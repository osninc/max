import { Actor } from "apify";
import axios from "axios-https-proxy-fix";
import { zillow } from "./constants/zillow.js"
import { processError } from "./error.js";
import { getProxyUrl } from "./network/axios.js"
import { defaultHeaders, randomHeaders } from "./network/shared/headers.js";
import { BasicCrawler, Dataset, Configuration } from 'crawlee';
import { getPropertyParams } from "./zillowGraphQl.js";

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

const fetchDetailsData = async (zpid) => {
    const url = zillow.url.details
    const params = getPropertyParams(zpid)

    let baseConfig = {
        //headerGeneratorOptions: { ...randomHeaders },
        headers: {
            ...defaultHeaders,
            Referer: "https://www.zillow.com/",
            "Referrer-Policy": "unsafe-url"
        },
        responseType: "json"
    }

    if (proxy !== "none") {
        const proxyUrl = await getProxyUrl(proxy);
        baseConfig = {
            ...baseConfig,
            rejectUnauthorized: false,
            proxy: proxyUrl
        }
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
            }
            let finalRequest;

            if (proxy !== "none") {
                const proxyUrl = await getProxyUrl(proxy);
                defaultRequest = {
                    ...defaultRequest,
                    proxyUrl
                }
            }

            finalRequest = {
                ...defaultRequest,
                responseType: "json"
            }

            // 'request' contains an instance of the Request class
            // Here we simply fetch the HTML of the page and store it to a dataset
            const { body } = await sendRequest(finalRequest);

            console.log(body.errors)
            const data = body.results;
            console.log({ data })

            returnObj = data
        }
    });

    // await crawler.run([
    //     baseConfig
    // ]);

    try {
        const response = await axios.post(url, params, baseConfig)
        const data = response.data

        return data;
    } catch (error) {
        processError("fetchDetailsData", error)
        return {}
    }
}
// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    zpid,
    proxy
} = input;

const result = await fetchDetailsData(zpid);

await Actor.pushData([result]);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
