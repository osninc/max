import { Actor } from 'apify'
import _ from 'lodash'
import { getCookiesFromResponse, Log } from 'crawlee'
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix'
import { HeaderGenerator } from 'header-generator'

import { GlobalContext, labeledLog } from '../base-utils'

import { IBaseFinalInput, IBaseGlobalContextShared } from './types'
import { getProxyUrl, parseProxyUrl } from './proxy'
import { DEFAULT_HEADERS } from './headers'
import { isRequestBlocked } from './request'

export const DEFAULT_SESSIONS_KVS_NAME = 'zillow-count-sessions'
export const getSessionsUsingInput = async (input: IBaseFinalInput) => {
    const label = 'getSessions'
    const log = labeledLog({ label })

    const { sessionsKvsName = DEFAULT_SESSIONS_KVS_NAME, sessions: inputSessions = [] } = input
    const keyValueStore = await Actor.apifyClient.keyValueStores().getOrCreate(sessionsKvsName)
    const kvsClient = Actor.apifyClient.keyValueStore(keyValueStore.id)
    // const sessionsKvsKeysResult = await kvsClient.listKeys({ limit: 1 })
    const kvsRecordName = 'SESSIONS'

    const logInfo: any = { sessionsKvsName, kvsRecordName, inputSessions }

    if (inputSessions && !Array.isArray(inputSessions)) {
        log.error('Passed data is not valid:', { ...logInfo })
        throw new Error(`${label}: Passed data is not valid!`)
    }

    let finalSessions: any[] = []
    if (Array.isArray(inputSessions) && inputSessions.length) {
        finalSessions = inputSessions
    } else {
        const kvsRecordResult = await kvsClient.getRecord(kvsRecordName)
        if (kvsRecordResult) {
            const kvsRecordValue = kvsRecordResult?.value as any
            if (!kvsRecordValue) {
                log.error('Required data is missing:', { kvsRecordValue, kvsRecordResult, ...logInfo })
                throw new Error(`${label}: Required data is missing!`)
            }
            finalSessions = _.uniqBy(kvsRecordValue, 'proxyUrl')
        }
    }

    return finalSessions
}

export const getSession = async (
    globalContext: GlobalContext<any, any, IBaseGlobalContextShared>,
    log: Log,
    forceClean = true
) => {
    const result: { proxyUrl?: string; cookie?: string; requestHeaders?: any; creationTime?: number } = {
        creationTime: new Date().getTime()
    }
    let retries = 0
    const url = 'https://www.zillow.com/'
    while (!result.proxyUrl) {
        const proxyUrl = await getProxyUrl(globalContext)
        if (!forceClean) {
            result.proxyUrl = proxyUrl
            break
        }
        const requestHeaders = {
            ...new HeaderGenerator().getHeaders({ devices: ['desktop'] }),
            ...DEFAULT_HEADERS,
            Referer: url,
            'Referrer-Policy': 'unsafe-url'
        }
        const finalConfig: AxiosRequestConfig = {
            url,
            headers: requestHeaders,
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
                result.requestHeaders = requestHeaders
                result.cookie = cookies.map((cookie: any) => `${cookie.key}=${cookie.value}`).join(';')
                result.creationTime = new Date().getTime()
            }
        } catch (e) {
            void e
        }
        globalContext.shared.inUseOrBlockedProxies.push(proxyUrl)
        retries++
        if (retries > 3) {
            break
        }
    }

    log.debug('getSession result', result)

    return result
}
