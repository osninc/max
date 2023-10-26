import * as crypto from 'crypto'

import { Actor } from 'apify'
import c from 'ansi-colors'
import { createRequestDebugInfo, Dataset, KeyValueStore, log, sleep } from 'crawlee'
import _ from 'lodash'
import { Page } from 'playwright-core'

export const getMinNumber = (defaultNumber: number, ...numbers: number[]) =>
    Math.min(...numbers, defaultNumber) || defaultNumber

export const getValidKey = (str: string, hashKey = false) => {
    if (!hashKey) {
        // return str.replace(/[^[a-zA-Z0-9!\-_.'()]/g, '');
        return str.replace(/([+/=])/g, '')
    }
    return crypto
        .createHash('sha256')
        .update(str)
        .digest('base64')
        .replace(/([+/=])/g, '')
        .substr(0, 255)
}

export const parseHrtimeToSeconds = (hrtime: [number, number]) => {
    return +(hrtime[0] + hrtime[1] / 1e9).toFixed(3)
}

export const toPascalCase = (str: string) => {
    return _.startCase(_.camelCase(str)).replace(/ /g, '')
}

export const labelMessage = (options: {
    label: string
    message: string
    isToPascalCase?: boolean
    styleFunction?: any
}) => {
    const { label, message, isToPascalCase = true, styleFunction = c.blueBright } = options
    const finalLabel = isToPascalCase ? toPascalCase(label) : label
    return `${styleFunction(finalLabel)}: ${message}`
}

export const labeledLog = (options: { label: string; isToPascalCase?: boolean; styleFunction?: any }) => {
    const { label, isToPascalCase = true, styleFunction = c.blueBright } = options
    const logInstance = log.child({})
    ;['info', 'warning', 'softFail', 'error', 'debug', 'perf', 'exception'].forEach((func) => {
        // @ts-ignore
        const funcValue: any = logInstance[func].bind(logInstance)
        // @ts-ignore
        logInstance[func] = (...funcOptions: any[]) => {
            const firstParam = funcOptions.shift()
            const originalMessage = func === 'exception' ? funcOptions.shift() : firstParam
            const labeledMessage = labelMessage({
                label,
                isToPascalCase,
                styleFunction,
                message: originalMessage
            })
            const finalOptions =
                func === 'exception' ? [firstParam, labeledMessage, ...funcOptions] : [labeledMessage, ...funcOptions]

            funcValue(...finalOptions)
        }
    })
    return logInstance
}

async function saveScreenshot(page: Page, key = 'KEY') {
    const ss = await page.screenshot({ fullPage: true })
    await KeyValueStore.setValue(key, ss, { contentType: 'image/png' })
}

export const savePageScreenshot = async (page: Page, key = 'LOGIN_ERROR', disableLog = false) => {
    await saveScreenshot(page, key)
    if (!disableLog) {
        log.error(`A screenshot of the page is saved in run's default key value store under key "${key}"`)
    }
}

export const savePageHtml = async (page: Page, key = 'HTML', disableLog = false) => {
    const html = await page.content()
    await KeyValueStore.setValue(key, html, { contentType: 'text/html' })
    if (!disableLog) {
        log.error(`HTML of the page is saved in run's default key value store under key "${key}"`)
    }
}

const getMhtml = async (aPage: Page) => {
    const session = await aPage.context().newCDPSession(aPage)
    await session.send('Page.enable')
    const { data } = await session.send('Page.captureSnapshot')
    return data
}

export const savePageMhtml = async (page: Page, key = 'MHTML', disableLog = false) => {
    const mhtml = await getMhtml(page)
    await KeyValueStore.setValue(key, mhtml, { contentType: 'multipart/related' })
    if (!disableLog) {
        log.error(`MHTML of the page is saved in run's default key value store under key "${key}"`)
    }
}

export const savePageSnapshot = async (crawlingContext: any, keyPrefix = 'SNAPSHOT', extraData = {}) => {
    const { page } = crawlingContext
    const screenshotKey = `${keyPrefix}_SCREENSHOT.png`
    const htmlKey = `${keyPrefix}_HTML.html`
    const mhtmlKey = `${keyPrefix}_MHTML.mht`
    await savePageScreenshot(page, screenshotKey, true)
    await savePageHtml(page, htmlKey, true)
    const isSaveMhtml = crawlingContext.crawler.launchContext.launcher._serverLauncher._browserName === 'chromium'
    if (isSaveMhtml) {
        await savePageMhtml(page, mhtmlKey, true)
    }
    const keyValueStore = await Actor.openKeyValueStore()
    const snapshotData = {
        screenshot: keyValueStore.getPublicUrl(screenshotKey),
        html: keyValueStore.getPublicUrl(htmlKey),
        mhtml: isSaveMhtml ? keyValueStore.getPublicUrl(mhtmlKey) : null,
        url: page.url(),
        cookies: await page.context().cookies(),
        ...extraData
    }
    await KeyValueStore.setValue(keyPrefix, snapshotData)
    log.info(`SNAPSHOT of the page is saved in run's default key value store under key "${keyPrefix}"`)
}

let failedRequestsNumber = 0
let lastCheckTime = process.hrtime()
let isStopping = false

interface IFRHOptions {
    postHandlingFunction?: () => Promise<void>
    withSnapshot?: boolean
    failedRequestsTrackingTimeSecs?: number
    maxFailedRequestsNumberPerTime?: number
}

export const failedRequestHandler =
    (options: IFRHOptions = {}) =>
    async (crawlingContext: any) => {
        const {
            postHandlingFunction,
            withSnapshot = false,
            failedRequestsTrackingTimeSecs = 60,
            maxFailedRequestsNumberPerTime = 10
        } = options
        const {
            request,
            request: { url, uniqueKey, userData, headers, payload }
        } = crawlingContext

        const error = crawlingContext.error as Error

        const { label = 'UNDEFINED' } = userData

        const failedRequestHandlerLog = labeledLog({
            label: 'FAILED_REQUEST_HANDLER'
        })
        const requestLog = failedRequestHandlerLog.child({
            prefix: `FRH:${toPascalCase(label)}`
        })

        const errorMessage = error.message
        requestLog.error(`Request failed completely: ${url}, error: ${errorMessage}`)

        const debugData: any = {
            ...createRequestDebugInfo(request),
            headers,
            payload,
            uniqueKey,
            userData
        }

        if (withSnapshot) {
            const snapshotId = `ERROR_${request.id}`
            await savePageSnapshot(crawlingContext, snapshotId)
            debugData.snapshot = snapshotId
        }

        await Dataset.pushData({
            '#debug': debugData
        })
        if (postHandlingFunction) {
            await postHandlingFunction()
        }
        const currentTime = process.hrtime(lastCheckTime)
        const elapsedTimeSeconds = parseHrtimeToSeconds(currentTime)
        if (elapsedTimeSeconds > failedRequestsTrackingTimeSecs) {
            lastCheckTime = process.hrtime()
            failedRequestsNumber = 0
        }
        failedRequestsNumber++
        if (failedRequestsNumber > maxFailedRequestsNumberPerTime && !isStopping) {
            isStopping = true
            failedRequestHandlerLog.error('Multiple requests failed in a short time. Actor will stop.')
            Actor.getDefaultInstance().eventManager.emit('aborting')
            failedRequestHandlerLog.info('Waiting for 30 seconds...')
            await sleep(30000)
            failedRequestHandlerLog.info('Process will exit. Please, check that everything is working correctly.')
            process.exit(-1)
        }
    }

export const formatAndCleanText = (
    str: string,
    options: {
        replaceMultipleNewLineChar?: boolean
        replaceMultipleSpaceChar?: boolean
        removeCarriageReturnChar?: boolean
    }
) => {
    const {
        replaceMultipleNewLineChar = false,
        replaceMultipleSpaceChar = false,
        removeCarriageReturnChar = false
    } = options
    let resultStr = str
    if (replaceMultipleNewLineChar) {
        resultStr = resultStr.replace(/\n+/g, ' ')
    }
    if (replaceMultipleSpaceChar) {
        resultStr = resultStr.replace(/[^\S\n\r]+/g, ' ')
    }
    if (removeCarriageReturnChar) {
        resultStr = resultStr.replace(/\r/g, '')
    }

    return resultStr
}

export const queryParametersToString = (options: {
    queryParameters: { [index: string]: any }
    encodeKey?: boolean
    encodeValue?: boolean
}) => {
    const { queryParameters, encodeKey = true, encodeValue = true } = options
    return Array.from(Object.keys(queryParameters))
        .map((key) => {
            let qpKey = key
            if (encodeKey) {
                qpKey = encodeURIComponent(qpKey)
            }
            let qpValue = queryParameters[key]
            if (typeof qpValue === 'object') {
                qpValue = JSON.stringify(qpValue)
            }
            if (encodeValue) {
                qpValue = encodeURIComponent(qpValue)
            }
            return `${qpKey}=${qpValue}`
        })
        .join('&')
}

export const createRandomJqueryJsonpCallbackFunctionName = () => {
    const twentyDigitsNumber = `${Math.floor(1000000000 + Math.random() * 9000000000)}${Math.floor(
        1000000000 + Math.random() * 9000000000
    )}`
    return `jQuery${twentyDigitsNumber}_${Date.now()}`
}

export const getJsonpResponseContent = (responseBody: string, callbackFunctionName: string) => {
    const responseBodyText = responseBody.toString()
    const jsonpContent = responseBodyText.substring(callbackFunctionName.length + 1, responseBodyText.length - 1)
    return jsonpContent
}

export const convertJsonpResponseToJson = (responseBody: string, callbackFunctionName: string) => {
    const jsonpContent = getJsonpResponseContent(responseBody, callbackFunctionName)
    return JSON.parse(jsonpContent)
}

const getResponseData = (options: {
    crawlingContext: any
    response?: { statusCode?: number; headers?: any; body?: string }
}) => {
    const { crawlingContext, response } = options
    const availableResponse = response || crawlingContext.response
    const { statusCode = 200, headers = {} } = availableResponse
    let { body = '' } = availableResponse
    if (Buffer.isBuffer(body)) {
        body = body.toString()
    }
    const responseData = {
        statusCode,
        headers,
        body
    }
    return responseData
}

const saveResponseDataToRequest = (options: { crawlingContext: any; responseData: any }) => {
    const { crawlingContext, responseData } = options

    const { responses = [] } = crawlingContext.request.userData
    responses.push(responseData)
    crawlingContext.request.userData.responses = responses
}

export const persistResponseDataIntoRequest = (options: {
    crawlingContext: any
    response?: { statusCode?: number; headers?: any; body?: string }
}) => {
    const { crawlingContext, response } = options
    const responseData = getResponseData({ crawlingContext, response })
    saveResponseDataToRequest({ crawlingContext, responseData })
}

export const persistHeavyResponseDataIntoRequest = async (options: {
    crawlingContext: any
    response?: { statusCode?: number; headers?: any; body?: string }
}) => {
    const { crawlingContext, response } = options
    const responseData = getResponseData({ crawlingContext, response })

    const { page } = crawlingContext
    const { id = `${Math.random()}`.replace('0.', '') } = crawlingContext.request
    const { label = 'UNDEFINED', responses = [] } = crawlingContext.request.userData
    const responseKey = `${id}_${label}_R${responses.length + 1}`
    await KeyValueStore.setValue(responseKey, responseData)
    if (page) {
        await KeyValueStore.setValue(`${responseKey}_SS`, await page.screenshot(), { contentType: 'image/png' })
    }
    saveResponseDataToRequest({ crawlingContext, responseData })
}
