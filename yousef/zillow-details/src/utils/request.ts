import { BasicCrawlingContext, Dictionary } from 'crawlee'
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix'
import { OptionsInit } from 'got-scraping'
import _ from 'lodash'

import { GlobalContext } from '../base-utils'

import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IRequestResponse } from './types'
import { REQUEST_HANDLER } from './consts'
import { SEARCH_HEADERS } from './headers'
import { getSmartproxyProxyUrl, parseProxyUrl } from './proxy'

export const executeRequest = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IBaseFinalInput, IBaseGlobalContextState, IBaseGlobalContextShared>,
    isRequestBlocked: Function
): Promise<IRequestResponse> => {
    const { request, sendRequest, session, log } = crawlingContext
    const { /* proxyType, */ scraper } = globalContext.input

    const cacheKey = { type: 'executeRequest', requestId: request.id }
    const cacheValue = globalContext.shared.cache.get(cacheKey)
    if (cacheValue?.isRequestSucceeded) {
        return cacheValue?.data
    }
    const sessionIsBlocked: boolean | undefined = session?.isBlocked() || !session?.userData?.proxyUrl
    const proxyUrl: string | undefined = sessionIsBlocked
        ? getSmartproxyProxyUrl(globalContext.input)
        : session?.userData?.proxyUrl
    // @ts-ignore
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
        const { searchParams } = request.userData.requestOptions ?? {}
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
            headers: { ...SEARCH_HEADERS, ...request.headers /* ...requestHeaders */ },
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
    globalContext.shared.cache.set(cacheKey, { isRequestSucceeded: true, data: { statusCode, body } })
    return { statusCode, body }
}
