import { gotScraping } from 'got-scraping'

import { GlobalContext } from '../base-utils'

import { IFinalInput, IGlobalContextShared } from './types'
import { randomXToY } from './atom'

export const PROXY_TYPE = {
    APIFY_RESIDENTIAL: 'APIFY_RESIDENTIAL',
    SMARTPROXY_RESIDENTIAL: 'SMARTPROXY_RESIDENTIAL',
    APIFY_DATACENTER: 'APIFY_DATACENTER',
    SMARTPROXY_DATACENTER: 'SMARTPROXY_DATACENTER'
}

export const getSmartproxyProxyUrl = (input: IFinalInput) => {
    const sessionDurationMinutes = input.sessionDurationMinutes ?? 30
    const username = 'sp9tvo5x4o'
    const password = input.proxyType === PROXY_TYPE.SMARTPROXY_DATACENTER ? 'TestProxy!' : 'g59iYxEz22awOontwB'

    const start = randomXToY(1, 5000)
    const proxyUrl =
        input.proxyType === PROXY_TYPE.SMARTPROXY_DATACENTER
            ? `http://${username}:${password}@gate.dc.smartproxy.com:${20000 + start}`
            : // eslint-disable-next-line max-len
              `http://user-${username}-sessionduration-${sessionDurationMinutes}:${password}@us.smartproxy.com:${
                  10000 + start
              }`
    return proxyUrl
}

export const getSmartproxyProxyUrls = (input: IFinalInput, maxProxyCount = 500) => {
    const sessionDurationMinutes = input.sessionDurationMinutes ?? 30
    const username = 'sp9tvo5x4o'
    const password = input.proxyType === PROXY_TYPE.SMARTPROXY_DATACENTER ? 'TestProxy!' : 'g59iYxEz22awOontwB'

    const proxyUrls = []
    const start = randomXToY(1, 5000)
    for (let i = start; i < start + maxProxyCount; i++) {
        const proxyUrl =
            input.proxyType === PROXY_TYPE.SMARTPROXY_DATACENTER
                ? `http://${username}:${password}@gate.dc.smartproxy.com:${20000 + i}`
                : // eslint-disable-next-line max-len
                  `http://user-${username}-sessionduration-${sessionDurationMinutes}:${password}@us.smartproxy.com:${
                      10000 + i
                  }`

        proxyUrls.push(proxyUrl)
    }

    return proxyUrls
}

export const pickProxyUrl = (proxies: string[], blackedProxies: string[]) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const proxy of proxies) {
        if (!blackedProxies.includes(proxy)) return proxy
    }

    return ''
}

export const parseProxyUrl = (proxyUrl: string) => {
    const urlObj = new URL(proxyUrl)
    const obj = {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port,
        auth: {
            username: urlObj.username,
            password: urlObj.password
        }
    }

    return obj
}

// let apifyProxyConfiguration: ProxyConfiguration | undefined
export const getProxyUrl = async (globalContext: GlobalContext<any, any, IGlobalContextShared>) => {
    const proxyType = globalContext.input.proxyType
    const defaultProxyUrls = globalContext.shared.defaultProxyUrls

    let proxyUrls: string[]

    switch (proxyType) {
        case PROXY_TYPE.APIFY_RESIDENTIAL: {
            // if (!apifyProxyConfiguration) {
            //     apifyProxyConfiguration = await proxyConfigurationFunction({
            //         proxyConfig: { useApifyProxy: true, groups: ['RESIDENTIAL'], countryCode: 'US' },
            //         required: true,
            //         force: true
            //     })
            // }

            // const apifyProxyUrl = await apifyProxyConfiguration?.newUrl(randomXToY(1, 10000))
            const apifyProxyUrl = `http://groups-RESIDENTIAL,countryCode-US,session-${randomXToY(1, 10000)}:${
                process.env.APIFY_PROXY_PASSWORD
            }@proxy.apify.com:8000`
            proxyUrls = apifyProxyUrl ? [apifyProxyUrl] : defaultProxyUrls
            break
        }
        case PROXY_TYPE.APIFY_DATACENTER: {
            // if (!apifyProxyConfiguration) {
            //     apifyProxyConfiguration = await proxyConfigurationFunction({
            //         proxyConfig: { useApifyProxy: true, groups: ['BUYPROXIES94952'], countryCode: 'US' },
            //         required: true,
            //         force: true
            //     })
            // }
            // http://groups-BUYPROXIES94952,session-123:PWDW@proxy.apify.com:8000
            // const apifyProxyUrl = await apifyProxyConfiguration?.newUrl(randomXToY(1, 10000))
            const apifyProxyUrl = `http://groups-BUYPROXIES94952,session-${randomXToY(1, 10000)}:${
                process.env.APIFY_PROXY_PASSWORD
            }@proxy.apify.com:8000`
            proxyUrls = apifyProxyUrl ? [apifyProxyUrl] : defaultProxyUrls
            break
        }
        default: {
            proxyUrls = defaultProxyUrls
            break
        }
    }
    const proxyUrl = pickProxyUrl(proxyUrls, globalContext.shared.inUseOrBlockedProxies)
    return proxyUrl
}

const SMARTPROXY_API_KEY =
    // eslint-disable-next-line max-len
    '372e2e8c70bc824529f2c2af144867ceb17baf0e6fa6e35481952e2d2e75f486855a518606be4e1687250573806f0daa1195e409644496922fc7c16acaa48ac318d7c7f3a0e073437c'
export const getSmartproxyConsumption = async (input: IFinalInput) => {
    const { proxyType } = input
    let consumption = 0
    let subscription: any
    const response = await gotScraping({
        url: `https://api.smartproxy.com/v2/subscriptions?api-key=${SMARTPROXY_API_KEY}`,
        responseType: 'json'
    })
    if (response) {
        subscription = (response?.body as any)?.find((s: any) => {
            return (
                (proxyType === PROXY_TYPE.SMARTPROXY_DATACENTER && s.service_type === 'shared_proxies') ||
                (proxyType === PROXY_TYPE.SMARTPROXY_RESIDENTIAL && s.service_type === 'residential_proxies')
            )
        })
        if (subscription) {
            consumption = Number.parseFloat(subscription.traffic)
        }
    }

    return consumption
}
