import { BasicCrawlingContext, Dictionary } from 'crawlee'
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix'
import { OptionsInit } from 'got-scraping'
import _ from 'lodash'

import { GlobalContext } from '../base-utils'

import { IFinalInput, IGlobalContextShared, IGlobalContextState, IRequestResponse } from './types'
import { alphaNum, getRandomInt } from './atom'
import { DESTINATION, REQUEST_HANDLER, ZILLOW } from './consts'
import { RANDOM_HEADERS, SEARCH_HEADERS } from './headers'
import { getSmartproxyProxyUrl, parseProxyUrl } from './proxy'
import { getSearchQuery } from './input'

export const getRequestConfig = (destination: string, input: IFinalInput, extraData?: any) => {
    const { searchType } = input

    let requestConfig: any = {}

    // change search terms depending on searchby option
    const query = getSearchQuery(input)

    // Determine regiontype
    let nameForUrl = query
    // const regionType = zillow.regionType[searchType.toLowerCase()]
    if (['city', 'county'].includes(searchType.toLowerCase())) {
        nameForUrl = alphaNum(query).replace(/ /gi, '-').toLowerCase()
    }

    // if (isTest) {
    //     return getTestRegion(searchType)
    // }
    const userData = {
        query
    }
    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            referer: 'https://www.zillow.com/',
            'referrer-policy': 'unsafe-url'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.LOCATION_MAP_BOUNDS: {
            const url = ZILLOW.URL.MAP_BOUND.replace('NAME', nameForUrl)
            requestConfig = {
                ...baseConfig,
                url
            }
            requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break
        }
        case DESTINATION.LOCATION_REGION: {
            requestConfig = {
                ...baseConfig,
                url: ZILLOW.URL.REGION
            }
            requestConfig.userData.requestOptions = { responseType: 'json', searchParams: { q: query } }
            break
        }
        case DESTINATION.SEARCH: {
            const { searchUrl, searchParams, status, lot, time } = extraData ?? {}

            const requestId = getRandomInt(20)

            const searchDataUrl = `${ZILLOW.URL.SEARCH}?searchQueryState=${encodeURIComponent(
                JSON.stringify(searchParams.searchQueryState)
            )}&wants=${encodeURIComponent(JSON.stringify(ZILLOW.WANTS))}&requestId=${requestId}`

            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    referer: searchUrl,
                    'referrer-policy': 'unsafe-url'
                },
                userData: {
                    searchType,
                    status,
                    searchUrl,
                    realSearch: searchParams.searchQueryState.usersSearchTerm,
                    lot,
                    time
                }
            }
            requestConfig.userData.requestOptions = {
                responseType: 'json',
                headerGeneratorOptions: { ...RANDOM_HEADERS }
                // searchParams: {
                //     ...searchParams,
                //     requestId
                // }
            }

            break
        }
        default:
            throw new Error(`Unknown destination: ${destination}`)
    }
    return requestConfig
}

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 ||
    (typeof body === 'string' && body?.includes('Request blocked')) ||
    (typeof body === 'object' && body?.blockScript?.includes('captcha'))

export const executeRequest = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
): Promise<IRequestResponse> => {
    const { request, sendRequest, session, log } = crawlingContext
    const { /* proxyType, */ scraper } = globalContext.input

    const sessionIsBlocked: boolean | undefined = session?.isBlocked() || !session?.userData?.proxyUrl
    const proxyUrl: string | undefined = sessionIsBlocked
        ? getSmartproxyProxyUrl(globalContext.input)
        : session?.userData?.proxyUrl
    const requestHeaders: object | undefined = sessionIsBlocked
        ? {}
        : _.omit(session?.userData?.requestHeaders, ['accept', 'accept-language', 'upgrade-insecure-requests', 'dnt'])
    const cookie: string | undefined = sessionIsBlocked ? '' : session?.userData?.cookie
    // if (proxyType !== 'none' /* && request.retryCount !== 0 */) {
    //     switch (request.retryCount) {
    //         /* case 0: {
    //             proxyUrl =
    //                 (await globalContext.shared.proxyConfiguration?.newUrl(`${Math.round(Math.random() * 10000)}`))
    //                 ??
    //                 ''
    //             break
    //         } */
    //         default: {
    //             proxyUrl = pickNonBlockedProxyUrl(globalContext.shared.proxyUrls,
    //             globalContext.shared.blockedProxies)
    //             crawlingContext.request.userData.proxyUrl = proxyUrl
    //             break
    //         }
    //     }
    // }

    let response: any
    let statusCode: number
    let body: any
    if (scraper === REQUEST_HANDLER.AXIOS) {
        const AXIOS_DEFAULTS = {
            timeout: 30000
        }
        const { headers } = request
        const { searchParams } = request.userData.requestOptions
        const finalConfig: AxiosRequestConfig = {
            headers: {
                ...SEARCH_HEADERS,
                ...headers
                // ...requestHeaders
            },
            params: searchParams,
            ...AXIOS_DEFAULTS,
            ...(proxyUrl
                ? {
                      rejectUnauthorized: false,
                      proxy: parseProxyUrl(proxyUrl) as any
                  }
                : {}),
            validateStatus: () => true
        }
        if (cookie) {
            finalConfig.headers = {
                ...finalConfig.headers,
                cookie
            }
        }
        response = await axios.get(request.url, finalConfig)

        statusCode = response.status as number
        body = response.data as any
    } else {
        // Build the request
        const finalRequest: Partial<OptionsInit> = {
            url: request.url,
            method: request.method,
            body: request.payload,
            headers: { ...SEARCH_HEADERS, ...request.headers, ...requestHeaders },
            ...request.userData.requestOptions,
            // headerGeneratorOptions: { ...randomHeaders }
            timeout: { connect: 5000, request: 30000 }
        }
        if (proxyUrl) {
            finalRequest.proxyUrl = proxyUrl
        }
        if (cookie) {
            finalRequest.headers = {
                ...finalRequest.headers,
                cookie
            }
        }
        delete finalRequest.headerGeneratorOptions

        response = await sendRequest(finalRequest)
        statusCode = response.statusCode as number
        body = response.body as any
    }

    if (isRequestBlocked(statusCode, body)) {
        proxyUrl && globalContext.shared.inUseOrBlockedProxies.push(proxyUrl)
        session?.retire()
        log.debug('Request blocked!', { proxyUrl })
        throw new Error('Request blocked!')
    }
    return { statusCode, body }
}
