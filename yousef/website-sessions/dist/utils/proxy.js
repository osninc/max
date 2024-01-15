"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartproxyConsumption = exports.getProxyUrl = exports.parseProxyUrl = exports.pickProxyUrl = exports.getSmartproxyProxyUrls = exports.getSmartproxyProxyUrl = exports.PROXY_TYPE = void 0;
const got_scraping_1 = require("got-scraping");
const apify_1 = require("apify");
const atom_1 = require("./atom");
exports.PROXY_TYPE = {
    APIFY_RESIDENTIAL: 'APIFY_RESIDENTIAL',
    SMARTPROXY_RESIDENTIAL: 'SMARTPROXY_RESIDENTIAL',
    APIFY_DATACENTER: 'APIFY_DATACENTER',
    SMARTPROXY_DATACENTER: 'SMARTPROXY_DATACENTER',
    NONE: 'NONE'
};
const getSmartproxyProxyUrl = (input) => {
    const sessionDurationMinutes = input.sessionDurationMinutes ?? 30;
    const username = 'sp9tvo5x4o';
    const password = input.proxyType === exports.PROXY_TYPE.SMARTPROXY_DATACENTER ? 'TestProxy!' : 'g59iYxEz22awOontwB';
    const start = (0, atom_1.randomXToY)(1, 5000);
    const proxyUrl = input.proxyType === exports.PROXY_TYPE.SMARTPROXY_DATACENTER
        ? `http://${username}:${password}@gate.dc.smartproxy.com:${20000 + start}`
        : // eslint-disable-next-line max-len
            `http://user-${username}-sessionduration-${sessionDurationMinutes}:${password}@us.smartproxy.com:${10000 + start}`;
    return proxyUrl;
};
exports.getSmartproxyProxyUrl = getSmartproxyProxyUrl;
const getSmartproxyProxyUrls = (input, maxProxyCount = 1000) => {
    const sessionDurationMinutes = input.sessionDurationMinutes ?? 30;
    const username = 'sp9tvo5x4o';
    const password = input.proxyType === exports.PROXY_TYPE.SMARTPROXY_DATACENTER ? 'TestProxy!' : 'g59iYxEz22awOontwB';
    const proxyUrls = [];
    const start = (0, atom_1.randomXToY)(1, 5000);
    for (let i = start; i < start + maxProxyCount; i++) {
        const proxyUrl = input.proxyType === exports.PROXY_TYPE.SMARTPROXY_DATACENTER
            ? `http://${username}:${password}@gate.dc.smartproxy.com:${20000 + i}`
            : // eslint-disable-next-line max-len
                `http://user-${username}-sessionduration-${sessionDurationMinutes}:${password}@us.smartproxy.com:${10000 + i}`;
        proxyUrls.push(proxyUrl);
    }
    return proxyUrls;
};
exports.getSmartproxyProxyUrls = getSmartproxyProxyUrls;
const pickProxyUrl = (proxies, blackedProxies) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const proxy of proxies) {
        if (!blackedProxies.includes(proxy))
            return proxy;
    }
    return '';
};
exports.pickProxyUrl = pickProxyUrl;
const parseProxyUrl = (proxyUrl) => {
    const urlObj = new URL(proxyUrl);
    const obj = {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port,
        auth: {
            username: urlObj.username,
            password: urlObj.password
        }
    };
    return obj;
};
exports.parseProxyUrl = parseProxyUrl;
// let apifyProxyConfiguration: ProxyConfiguration | undefined
let apifyProxyPassword;
const getProxyUrl = async (globalContext) => {
    const proxyType = globalContext.input.proxyType;
    const defaultProxyUrls = globalContext.shared.defaultProxyUrls;
    if ([exports.PROXY_TYPE.APIFY_DATACENTER, exports.PROXY_TYPE.APIFY_RESIDENTIAL].includes(proxyType)) {
        // if (!apifyProxyConfiguration) {
        //     apifyProxyConfiguration = await proxyConfigurationFunction({
        //         proxyConfig: { useApifyProxy: true, groups: ['RESIDENTIAL'], countryCode: 'US' },
        //         required: true,
        //         force: true
        //     })
        // }
        if (!apifyProxyPassword) {
            const user = await apify_1.Actor.apifyClient.user(apify_1.Actor.getEnv()?.userId ?? undefined).get();
            apifyProxyPassword = user?.proxy?.password ?? process.env.APIFY_PROXY_PASSWORD;
            // apifyProxyPassword = (Actor.getEnv() as any)?.proxyPassword ?? process.env.APIFY_PROXY_PASSWORD
        }
    }
    let proxyUrls;
    switch (proxyType) {
        case exports.PROXY_TYPE.APIFY_RESIDENTIAL: {
            // if (!apifyProxyConfiguration) {
            //     apifyProxyConfiguration = await proxyConfigurationFunction({
            //         proxyConfig: { useApifyProxy: true, groups: ['RESIDENTIAL'], countryCode: 'US' },
            //         required: true,
            //         force: true
            //     })
            // }
            // const apifyProxyUrl = await apifyProxyConfiguration?.newUrl(randomXToY(1, 10000))
            const apifyProxyUrl = `http://groups-RESIDENTIAL,country-US,session-${(0, atom_1.randomXToY)(1, 10000)}:${apifyProxyPassword}@proxy.apify.com:8000`;
            proxyUrls = apifyProxyUrl ? [apifyProxyUrl] : defaultProxyUrls;
            break;
        }
        case exports.PROXY_TYPE.APIFY_DATACENTER: {
            // if (!apifyProxyConfiguration) {
            //     apifyProxyConfiguration = await proxyConfigurationFunction({
            //         proxyConfig: { useApifyProxy: true, groups: ['BUYPROXIES94952'], countryCode: 'US' },
            //         required: true,
            //         force: true
            //     })
            // }
            // http://groups-BUYPROXIES94952,session-123:PWDW@proxy.apify.com:8000
            // const apifyProxyUrl = await apifyProxyConfiguration?.newUrl(randomXToY(1, 10000))
            const apifyProxyUrl = `http://groups-BUYPROXIES94952,session-${(0, atom_1.randomXToY)(1, 10000)}:${apifyProxyPassword}@proxy.apify.com:8000`;
            proxyUrls = apifyProxyUrl ? [apifyProxyUrl] : defaultProxyUrls;
            break;
        }
        default: {
            proxyUrls = defaultProxyUrls;
            break;
        }
    }
    const proxyUrl = (0, exports.pickProxyUrl)(proxyUrls, globalContext.shared.inUseOrBlockedProxies);
    return proxyUrl;
};
exports.getProxyUrl = getProxyUrl;
const SMARTPROXY_API_KEY = 
// eslint-disable-next-line max-len
'372e2e8c70bc824529f2c2af144867ceb17baf0e6fa6e35481952e2d2e75f486855a518606be4e1687250573806f0daa1195e409644496922fc7c16acaa48ac318d7c7f3a0e073437c';
const getSmartproxyConsumption = async (input) => {
    const { proxyType } = input;
    let consumption = 0;
    let subscription;
    const response = await (0, got_scraping_1.gotScraping)({
        url: `https://api.smartproxy.com/v2/subscriptions?api-key=${SMARTPROXY_API_KEY}`,
        responseType: 'json'
    });
    if (response) {
        subscription = response?.body?.find((s) => {
            return ((proxyType === exports.PROXY_TYPE.SMARTPROXY_DATACENTER && s.service_type === 'shared_proxies') ||
                (proxyType === exports.PROXY_TYPE.SMARTPROXY_RESIDENTIAL && s.service_type === 'residential_proxies'));
        });
        if (subscription) {
            consumption = Number.parseFloat(subscription.traffic);
        }
    }
    return consumption;
};
exports.getSmartproxyConsumption = getSmartproxyConsumption;
//# sourceMappingURL=proxy.js.map