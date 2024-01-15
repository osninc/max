import { BasicCrawlingContext, Dictionary } from 'crawlee'
import _ from 'lodash'
import { Actor } from 'apify'
import cheerio = require('cheerio')
import csvtojson = require('csvtojson')
import moment = require('moment')

import { IRequestResponse, START_TIMESTAMP } from './utils'
import {
    DEFAULT_OUTPUT,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    Inventory,
    prepareCsvDownloadRequests
} from './custom-utils'
import { GlobalContext, persistResponseDataIntoRequest } from './base-utils'

export const handleCsvListing = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const { request, crawler, log } = crawlingContext
    const { query } = request.userData

    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    }

    const response = crawlingContext.response as IRequestResponse

    const $ = cheerio.load(response.body as any)
    const items = $('.monthly > table > tbody > tr > td > a')
        .map((_i, item) => {
            const $item = $(item)
            const geoType = $item.parent().parent().find('th').text().replace(':', '').trim()
            const csvUrlPath = $item.attr('href')
            const csvUrl = csvUrlPath ?? ''
            // eslint-disable-next-line no-nested-ternary
            const kind = csvUrlPath ? (csvUrlPath.includes('History') ? 'Historical' : 'CurrentMonth') : ''
            const inventoryInfo: Inventory = { geoType, kind, csvUrl }
            return inventoryInfo
        })
        .toArray() as unknown as Inventory[]
    const nextUpdateDateString = $('.monthly > p.info').text()
    const nextUpdateDateStringExecArr = nextUpdateDateString
        ? /Next update scheduled for (.+?) with data/g.exec(nextUpdateDateString)
        : ''
    const nextUpdateDate =
        nextUpdateDateStringExecArr && nextUpdateDateStringExecArr[1]
            ? moment(new Date(nextUpdateDateStringExecArr[1])).format('YYYY-MM-DD')
            : ''
    if (!items.length || !nextUpdateDate) {
        log.error('Error getting CSV data', requestInfo)
        throw new Error('Error getting CSV data')
    }

    globalContext.state.nextUpdateDate = nextUpdateDate

    const requests = await prepareCsvDownloadRequests(globalContext.input, items, log, { ...requestInfo })
    const inventoryCount = requests.length

    if (!inventoryCount) {
        log.error('Page has no inventories:', { url: request.url })
        throw new Error(`Page has no inventories: ${request.url}`)
    }

    log.info('Inventories statistics:', {
        count: inventoryCount,
        requestInfo
    })

    globalContext.state.inventoryCount = inventoryCount
    log.info(`Total inventory count: ${globalContext.state.inventoryCount}`)

    log.debug('Adding inventory requests to the RQ:', {
        count: requests.length,
        requestInfo
    })
    const crawlerAddRequestsResult = await crawler.addRequests(requests, {
        waitForAllRequestsToBeAdded: true
    })

    for (let i = 0; i < crawlerAddRequestsResult.addedRequests.length; i++) {
        const addedRequest = crawlerAddRequestsResult.addedRequests[i]
        if (!addedRequest) continue
        const search = requests[i]
        const { requestId, wasAlreadyPresent } = addedRequest
        if (wasAlreadyPresent) {
            const presentRequest = await crawler?.requestQueue?.getRequest(requestId)
            const propsToPick = Object.keys(requestInfo)
            log.info('The inventory request is already added to the RQ:', {
                search,
                request: { URL: request.url, ..._.pick(request.userData, propsToPick) },
                addedRequest: {
                    URL: presentRequest?.url,
                    ..._.pick(presentRequest?.userData, propsToPick)
                }
            })
        }
    }
    log.debug('Finished adding inventory requests to the RQ:', {
        count: requests.length,
        requestInfo
    })
}

const transformInventoryData = async (data: string) => {
    const items = await csvtojson({
        delimiter: ',',
        output: 'json'
    }).fromString(data)
    return items
}

export const handleCsvDownload = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, any>
) => {
    const { request, log } = crawlingContext
    const inventory = request.userData.inventory as Inventory
    const { geoType, kind, csvUrl } = inventory

    const response = crawlingContext.response as IRequestResponse

    const requestInfo = {
        url: request.loadedUrl,
        geoType,
        kind,
        csvUrl
    }

    if (response.statusCode === 404) {
        globalContext.state.inventoryCount--
        log.info(`Page not found (404): ${request.url}`)
        return
    }

    log.info(`Downloading CSV file completed: ${request.url}`)

    const csvData = response.body as string

    let json
    try {
        json = await transformInventoryData(csvData)
    } catch (e: any) {
        log.error(e.message, requestInfo)
        throw e
    }

    if (!json) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no data', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no data: ${request.url}`)
    }

    log.info(`Transforming CSV file completed: ${request.url}`)

    const idRecordKey = `${new Date().toLocaleDateString('en-CA')}_${geoType}_${kind}`
    const keyValueStore = await Actor.openKeyValueStore()
    // let jsonStringify = ''
    // if (json.length > 1200000) {
    //     // untested code
    //     const maxItemsPerChunk = 50000
    //     for (let i = 0; i < json.length + 1; i + maxItemsPerChunk) {
    //         jsonStringify = JSON.stringify(json.slice(i, i + maxItemsPerChunk))
    //         jsonStringify += '\n'
    //     }
    // } else {
    //     jsonStringify = JSON.stringify(json)
    // }
    // const jsonStringify = await bigJson.stringify({
    //     body: json
    // })
    await keyValueStore.setValue(idRecordKey, json)
    // await keyValueStore.setValue(idRecordKey, serialize(json), { contentType: 'application/json' })
    const jsonUrl = keyValueStore.getPublicUrl(idRecordKey)

    log.info(`Uploading JSON file completed: ${request.url}`)

    globalContext.state.inventoryResults.push({
        ...DEFAULT_OUTPUT,
        ..._.pick(inventory, ['geoType', 'kind', 'csvUrl']),
        // [request.userData.searchType]: searchByText,
        timeStamp: START_TIMESTAMP,
        jsonUrl,
        // timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        // proxy,
        // taskName: `${globalContext.input.scraper}/${searchByText}`,
        scraper: globalContext.input.scraper
    })
}
