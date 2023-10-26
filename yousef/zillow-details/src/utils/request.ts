import { BasicCrawlingContext, Dictionary } from 'crawlee'
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix'

import { GlobalContext } from '../base-utils'

import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState } from './types'
import { REQUEST_HANDLER } from './consts'
import { DEFAULT_HEADERS } from './headers'
import { getSmartproxyProxyUrl, parseProxyUrl } from './proxy'

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 ||
    (typeof body === 'string' && body?.includes('Request blocked')) ||
    (typeof body === 'object' && body?.blockScript?.includes('captcha'))

export interface IRequestResponse {
    statusCode: number
    body: any

    [key: string]: any
}

export const executeRequest = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IBaseFinalInput, IBaseGlobalContextState, IBaseGlobalContextShared>
): Promise<IRequestResponse> => {
    const { request, sendRequest, session, log } = crawlingContext
    const { /* proxyType, */ scraper } = globalContext.input

    const sessionIsBlocked: boolean | undefined = session?.isBlocked() || !session?.userData?.proxyUrl
    const proxyUrl: string | undefined = sessionIsBlocked
        ? getSmartproxyProxyUrl(globalContext.input)
        : session?.userData?.proxyUrl
    const requestHeaders: object | undefined = sessionIsBlocked ? {} : session?.userData?.requestHeaders
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
    if (scraper === REQUEST_HANDLER.AXIOS.toLowerCase()) {
        const AXIOS_DEFAULTS = {
            timeout: 40000
        }
        const { headers } = request
        const { searchParams } = request.userData.requestOptions
        const finalConfig: AxiosRequestConfig = {
            headers: {
                ...DEFAULT_HEADERS,
                ...headers,
                ...requestHeaders
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
                Cookie: cookie
            }
        }
        response = await axios.get(request.url, finalConfig)

        statusCode = response.status as number
        body = response.data as any
    } else {
        // Build the request
        const finalRequest: any = {
            url: request.url,
            method: request.method,
            body: request.payload,
            headers: { ...request.headers, ...requestHeaders },
            ...request.userData.requestOptions
            // headerGeneratorOptions: { ...randomHeaders }
            // timeout: { connect: 5000, request: 5000 }
        }
        if (proxyUrl) {
            finalRequest.proxyUrl = proxyUrl
        }
        if (cookie) {
            finalRequest.headers = {
                ...finalRequest.headers,
                Cookie: cookie
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
