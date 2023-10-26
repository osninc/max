import { Dataset, Dictionary, PlaywrightCrawlingContext } from 'crawlee'

import { GlobalContext, persistResponseDataIntoRequest } from './base-utils'
import { DEFAULT_OUTPUT, OUTPUT_FIELDS } from './consts'
import { IExecuteRequestResponse, IFinalInput, IGlobalContextState } from './types'

export const isRequestBlocked = (statusCode: number, body: any, extraBlockFunc?: Function) => {
    return statusCode === 403 || (extraBlockFunc && extraBlockFunc(statusCode, body))
}

export const handleSession = async (
    crawlingContext: PlaywrightCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState>,
    extraData: any
) => {
    const { request, log, session } = crawlingContext
    const { requestHeaders, statusCode, body, cookie, proxyUrl }: IExecuteRequestResponse = extraData?.response ?? {}
    const { extraBlockFunc: extraBlockFuncStr } = globalContext.input
    const extraBlockFunc = extraBlockFuncStr ? eval(extraBlockFuncStr) : undefined

    const { id, websiteUrl, medium, proxyType } = request.userData
    const requestInfo: any = {
        url: request.loadedUrl,
        id,
        medium,
        proxyType,
        proxyUrl,
        statusCode,
        websiteUrl,
        body
    }

    if (statusCode === 404) {
        globalContext.state.sessionCount--
        log.info(`Page not found (404): ${request.url}`)
        return
    }

    if (isRequestBlocked(statusCode, body, extraBlockFunc)) {
        session?.retire()
        log.debug('Request blocked!', requestInfo)
        throw new Error('Request blocked!')
    }

    if (!proxyUrl) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no proxyUrl', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no proxyUrl: ${request.url}`)
    }

    log.debug('Saving session', requestInfo)

    await Dataset.pushData({
        ...DEFAULT_OUTPUT,
        [OUTPUT_FIELDS.ID]: id,
        [OUTPUT_FIELDS.MEDIUM]: medium,
        [OUTPUT_FIELDS.PROXY_TYPE]: proxyType,
        [OUTPUT_FIELDS.PROXY_URL]: proxyUrl,
        [OUTPUT_FIELDS.COOKIE]: cookie,
        [OUTPUT_FIELDS.REQUEST_HEADERS]: requestHeaders,
        [OUTPUT_FIELDS.CREATION_TIME]: new Date().getTime(),
        [OUTPUT_FIELDS.WEBSITE_URL]: websiteUrl,
        '#requestInfo': requestInfo
    })
}
