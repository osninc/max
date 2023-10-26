import { BasicCrawlingContext, Dictionary, getCookiesFromResponse, Log } from 'crawlee'
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix'
import { Actor } from 'apify'

import { createSessionFunctionBuilder, getValidKey, GlobalContext, queryParametersToString } from '../base-utils'
import { LABELS } from '../consts'

import { IFinalInput, IGlobalContextShared, IGlobalContextState, IRequestResponse, ISearch } from './types'
import { DEFAULT_HEADERS, RANDOM_HEADERS } from './headers'
import {
    DESTINATION,
    FOR_SALE_TIME_MATRIX,
    LOT_SIZE,
    PROXY_TYPE,
    REQUEST_HANDLER,
    SOLD_TIME_MATRIX,
    STATUS_MATRIX,
    WEBSITE
} from './consts'
import { buildSearchUrl } from './url'

export const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max)
}

export const sqft2acre = (num: any) => {
    if (num === '') return ''
    return parseFloat((num / 43560).toFixed(2))
}

export const alphaNum = (str: string) => {
    return str.replace(/[^0-9a-z ]/gi, '')
}

export const alphaNumWithoutSpace = (str: string) => {
    return str.replace(/[^0-9a-z]/gi, '')
}

export const camelizeStr = (str: string) => {
    return alphaNumWithoutSpace(str)
}

export const convertArea4Zillow = (params: any, searchType: string) => {
    let str = params.usersSearchTerm
    if (searchType.toLowerCase() === 'zipcode') {
        // Just in case city is more than one word
        str = `${params.cityState}-${params.usersSearchTerm}`
        return str
    }

    const newStr = alphaNum(str)
    return newStr.replace(/ /gi, '-').toLowerCase()
}

export const lotSizeToString = (min: any, max: any) => {
    let keyName = `${min}-${max}`

    if (max === '') keyName = `${min}+`
    if (min === '') keyName = `0-${max}`
    if (min === '' && max === '') keyName = 'TOTAL'

    return keyName
}

export const getSearchQuery = (input: IFinalInput) => {
    const { county, searchBy, state, zipCode } = input

    let query = county
    switch (searchBy.toLowerCase()) {
        case 'zipcode':
            query = zipCode
            break
        case 'state':
            query = state
            break
    }
    return query
}

export const getRequestConfig = (destination: string, input: IFinalInput, extraData?: any) => {
    const { searchBy } = input

    let requestConfig: any = {}

    // change search terms depending on searchby option
    const query = getSearchQuery(input)

    // if (isTest) {
    //     return getTestRegion(searchBy)
    // }
    const userData = {
        query
    }

    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            Referer: 'https://www.redfin.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.LOCATION: {
            const url = WEBSITE.URL.LOCATION.replace('QUERY', encodeURIComponent(query.toLowerCase()))
            requestConfig = {
                ...baseConfig,
                url
            }
            // requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break
        }
        case DESTINATION.SEARCH: {
            const { searchUrl, region, status, lot, time } = extraData ?? {}
            const queryParameters = {
                al: 1,
                include_nearby_homes: true,
                market: alphaNumWithoutSpace(query.toLowerCase()),
                ...(lot.max ? { max_parcel_size: lot.max } : {}),
                ...(lot.min ? { min_parcel_size: lot.min } : {}),
                num_homes: 5000,
                ord: 'days-on-redfin-asc',
                page_number: 1,
                region_id: region.id,
                region_type: region.type,
                ...(status === STATUS_MATRIX[0] ? { sf: '1,2,3,5,6,7' } : { sold_within_days: time }),
                start: 0,
                status: 9,
                ...(status === STATUS_MATRIX[0] ? { time_on_market_range: time } : {}),
                uipt: 5,
                v: 8
            }
            const searchDataUrl = `https://www.redfin.com/stingray/api/gis?${queryParametersToString({
                queryParameters,
                encodeKey: false,
                encodeValue: false
            })}`

            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    ...baseConfig.headers,
                    Referer: searchUrl,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                },
                userData: {
                    searchBy,
                    searchUrl,
                    status,
                    lot,
                    time:
                        (status === STATUS_MATRIX[0] ? FOR_SALE_TIME_MATRIX : SOLD_TIME_MATRIX).find(
                            (t) => t[0] === time
                        )?.[1] ?? time
                }
            }
            requestConfig.userData.requestOptions = {
                // responseType: 'json',
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

export const prepareSearchRequests = async (
    input: IFinalInput,
    log: Log,
    logInfo: any,
    location: { query?: any; region?: any },
    userData?: any
) => {
    const { query, region } = location

    if (!query || !region) {
        log.error('Required data is missing:', { ...logInfo, query, region })
        throw new Error('prepareSearchRequests: Required data is missing!')
    }

    let statusMatrix: string[] = []
    let timeMatrix: string[][] = []
    let lotSize: string[][] = []

    if (input.isTest) {
        statusMatrix = ['For Sale']
        timeMatrix = [['36m', '36 months']]
        lotSize = [['435600', '871200']]
    } else {
        statusMatrix = STATUS_MATRIX
        timeMatrix = FOR_SALE_TIME_MATRIX
        lotSize = LOT_SIZE
    }

    const searches: ISearch[] = []
    statusMatrix.forEach((status) => {
        timeMatrix = status === STATUS_MATRIX[0] ? FOR_SALE_TIME_MATRIX : SOLD_TIME_MATRIX
        timeMatrix.forEach((timeArr) => {
            lotSize.forEach((lotArr) => {
                const lot = { min: Number(lotArr[0]), max: Number(lotArr[1]) }
                const searchUrl = buildSearchUrl({ region, status, lot, time: timeArr[0] })
                const extraData = {
                    searchUrl,
                    region,
                    status,
                    lot,
                    time: timeArr[0]
                }

                const requestConfig = getRequestConfig(DESTINATION.SEARCH, input, extraData)
                searches.push({
                    url: requestConfig.userData.searchUrl,
                    requestParams: requestConfig
                })
            })
        })
    })

    const searchRequests = searches.map((search) => {
        const { url = '', requestParams = { url }, name, key = url || name } = search
        return {
            ...requestParams,
            uniqueKey: getValidKey(`${LABELS.SEARCH}_${key}`),
            userData: {
                ...userData,
                label: LABELS.SEARCH,
                search,
                ...search?.requestParams?.userData
            }
        }
    })

    return searchRequests
}

const randomXToY = (minVal: number, maxVal: number) => {
    const randVal = minVal + Math.random() * (maxVal - minVal)
    return Math.round(randVal)
}

export const pickProxyUrl = (proxies: string[], blackedProxies: string[]) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const proxy of proxies) {
        if (!blackedProxies.includes(proxy)) return proxy
    }

    return ''
}

export const getExternalProxyUrl = () => {
    const username = 'sp9tvo5x4o'
    const password = 'g59iYxEz22awOontwB'
    const proxyUrl = `http://${username}:${password}@us.smartproxy.com:${randomXToY(10000, 50000)}`

    return proxyUrl
}

export const getExternalProxyUrls = () => {
    const username = 'sp9tvo5x4o'
    const password = 'g59iYxEz22awOontwB'

    const proxyUrls = []
    const start = randomXToY(1, 1000)
    for (let i = start; i < start + 1000; i++) {
        const proxyUrl = `http://${username}:${password}@us.smartproxy.com:${10000 + i}`
        proxyUrls.push(proxyUrl)
    }

    return proxyUrls
}

const parseProxyUrl = (proxyUrl: string) => {
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

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 || (typeof body === 'string' && body?.includes('Request blocked'))

export const executeRequest = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
): Promise<IRequestResponse> => {
    const { request, sendRequest, session, log } = crawlingContext
    const { /* proxy, */ scraper } = globalContext.input

    const sessionIsBlocked: boolean | undefined = session?.isBlocked() || !session?.userData?.proxyUrl
    const proxyUrl: string | undefined = sessionIsBlocked ? getExternalProxyUrl() : session?.userData?.proxyUrl
    const cookie: string | undefined = sessionIsBlocked ? [] : session?.userData?.cookie
    // if (proxy !== 'none' /* && request.retryCount !== 0 */) {
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
            timeout: 60000
        }
        const { headers } = request
        const { searchParams } = request.userData?.requestOptions ?? {}
        const finalConfig: AxiosRequestConfig = {
            headers: {
                ...DEFAULT_HEADERS,
                ...headers
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
        let defaultRequest: any = {
            url: request.url,
            method: request.method,
            body: request.payload,
            headers: request.headers
            // headerGeneratorOptions: { ...randomHeaders }
            // timeout: { connect: 5000, request: 5000 }
        }
        if (proxyUrl) {
            defaultRequest = {
                ...defaultRequest,
                proxyUrl
            }
        }
        const finalRequest = {
            ...defaultRequest,
            // ..._.omit(request.userData.requestOptions, ['searchParams']),
            ...request.userData.requestOptions
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

export const createSessionFunctionBuilderCustom = (globalContext: GlobalContext<any, any, any>) => {
    return createSessionFunctionBuilder({
        websiteUrl: 'https://www.zillow.com/',
        // withProxyInfo: true
        extraRequestOptions: {
            headers: {
                Referer: 'https://www.zillow.com/',
                'Referrer-Policy': 'unsafe-url'
            }
        },
        proxyUrlBuilder: () => {
            let foundProxyUrl = false
            let proxyUrl: string | undefined

            while (!foundProxyUrl) {
                proxyUrl = getExternalProxyUrl()
                if (!globalContext.shared.inUseOrBlockedProxies.includes(proxyUrl)) {
                    foundProxyUrl = true
                }
            }
            return proxyUrl
        }
    })
}

const getProxyUrl = async (globalContext: GlobalContext<any, any, IGlobalContextShared>, _log: Log) => {
    const proxyType = globalContext.input.proxy
    let proxyUrls: string[]
    switch (proxyType) {
        case PROXY_TYPE.APIFY_RESIDENTIAL: {
            const apifyProxyUrl = await globalContext.shared.proxyConfiguration?.newUrl(randomXToY(1, 10000))
            proxyUrls = apifyProxyUrl ? [apifyProxyUrl] : globalContext.shared.proxyUrls
            break
        }
        default: {
            proxyUrls = globalContext.shared.proxyUrls
            break
        }
    }
    const proxyUrl = pickProxyUrl(proxyUrls, globalContext.shared.inUseOrBlockedProxies)
    return proxyUrl
}

export const getSession = async (
    globalContext: GlobalContext<any, any, IGlobalContextShared>,
    log: Log,
    websiteUrl: string,
    clean = true
) => {
    const result: { proxyUrl?: string; cookie?: string } = {}
    let retries = 0
    const url = websiteUrl
    while (!result.proxyUrl) {
        const proxyUrl = await getProxyUrl(globalContext, log)

        const finalConfig: AxiosRequestConfig = {
            url,
            headers: {
                ...DEFAULT_HEADERS,
                Referer: url,
                'Referrer-Policy': 'unsafe-url'
            },
            timeout: Actor.isAtHome() ? 4000 : 30000,
            proxy: parseProxyUrl(proxyUrl) as any,
            validateStatus: () => true
        }
        try {
            const response = await axios.get(url, finalConfig)

            const statusCode = response.status as number
            const body = response.data as any
            if (!isRequestBlocked(statusCode, body)) {
                result.proxyUrl = proxyUrl
                const cookies = getCookiesFromResponse(response)
                result.cookie = cookies.map((cookie: any) => `${cookie.key}=${cookie.value}`).join(';')
            }
        } catch (e) {
            void e
        }
        globalContext.shared.inUseOrBlockedProxies.push(proxyUrl)
        retries++
        if (retries > 3) {
            if (!clean) {
                result.proxyUrl = await getProxyUrl(globalContext, log)
            }
            break
        }
    }

    log.debug('getCleanSession result', result)

    return result
}

export const getCleanProxyUrl = async (globalContext: GlobalContext<any, any, any>, log: Log, websiteUrl: string) => {
    const { proxyUrl } = await getSession(globalContext, log, websiteUrl)

    log.debug(`getCleanProxyUrl result: ${proxyUrl}`)

    return proxyUrl
}

export const orderSearchResults = (searchResults: any[]): any[] => {
    const searchResultsMap = new Map()
    // eslint-disable-next-line no-restricted-syntax
    for (const searchResult of searchResults) {
        const key = `${searchResult.status} - ${searchResult.daysOnZillow ?? searchResult.soldInLast} - ${
            searchResult.acreage
        }`
        searchResultsMap.set(key, searchResult)
    }
    const orderedSearchResults: any[] = []
    STATUS_MATRIX.forEach((status) => {
        FOR_SALE_TIME_MATRIX.forEach((t) => {
            LOT_SIZE.forEach((lot) => {
                const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`
                const key = `${status} - ${t} - ${lotStr}`
                const searchResult = searchResultsMap.get(key)
                if (searchResult) orderedSearchResults.push(searchResult)
            })
        })
    })

    return orderedSearchResults
}
