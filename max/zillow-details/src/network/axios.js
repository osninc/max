import axios from "axios-https-proxy-fix";
import { defaultHeaders } from "./shared/headers.js";
import { zillow } from "../constants/zillow.js";
import { getProxy } from "./shared/proxy.js";

const axiosDefaults = {
    timeout: 4000
}

export const getProxyUrl = async (proxy) => {
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

