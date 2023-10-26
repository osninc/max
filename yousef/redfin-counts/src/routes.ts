import { BasicCrawlingContext, Dictionary } from 'crawlee'
import _ from 'lodash'
import moment = require('moment')

import { getValidKey, GlobalContext, persistResponseDataIntoRequest } from './base-utils'
import {
    DEFAULT_OUTPUT,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    IRequestResponse,
    lotSizeToString,
    OUTPUT_FIELDS,
    prepareSearchRequests,
    sqft2acre,
    START_TIMESTAMP,
    WEBSITE
} from './utils'
import { getState } from './utils/state'

export const handleLocation = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const { request, crawler, log } = crawlingContext
    const { searchBy } = globalContext.input
    const { query } = request.userData

    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    }

    const response = crawlingContext.response as IRequestResponse

    const json = JSON.parse((response.body as any)?.replace('{}&&', ''))
    const data = json?.payload?.sections?.[0]?.rows

    if (!data?.length) {
        log.error('Error getting location data', requestInfo)
        throw new Error('Error getting location data')
    }

    const regionId = Number(data[0]?.id?.split('_')?.[1] ?? '')
    const regionUrlPath = data[0]?.url ?? ''
    const regionUrl = regionUrlPath ? `https://www.redfin.com${regionUrlPath}` : ''

    if (!regionId || !regionUrl) {
        log.error('Required data is missing:', { ...requestInfo, query, regionId, regionUrl })
        throw new Error('Required data is missing!')
    }
    // await Actor.pushData({ scraper, proxy, message: 'Error getting location data' })

    const regionType = (WEBSITE.REGION_TYPE as any)[searchBy.toLowerCase()]

    const region = { id: regionId, type: regionType, url: regionUrl }

    globalContext.shared.region = region

    const { locationManager } = globalContext.shared

    const location = { query, region }

    const requests = await prepareSearchRequests(
        globalContext.input,
        log,
        { ...requestInfo },
        location,
        request.userData
    )
    const searchCount = requests.length

    if (!searchCount) {
        log.error('Page has no searches:', { url: request.url })
        throw new Error(`Page has no searches: ${request.url}`)
    }

    log.info('Searches statistics:', {
        count: searchCount,
        requestInfo
    })

    globalContext.state.searchCount = searchCount
    log.info(`Total search count: ${globalContext.state.searchCount}`)

    await locationManager.cacheLocation(getValidKey(request.userData.query), location)

    log.debug('Adding search requests to the RQ:', {
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
            log.info('The search request is already added to the RQ:', {
                search,
                request: { URL: request.url, ..._.pick(request.userData, propsToPick) },
                addedRequest: {
                    URL: presentRequest?.url,
                    ..._.pick(presentRequest?.userData, propsToPick)
                }
            })
        }
    }
    log.debug('Finished adding search requests to the RQ:', {
        count: requests.length,
        requestInfo
    })
}

const transformSearchData = (data: any) => {
    const homes = data?.payload?.originalHomes?.homes ?? data?.payload?.homes
    const listings = (homes ?? []).map((result: any) => {
        let mappedResult = {
            price: '',
            lotAreaString: '',
            latitude: '',
            longitude: '',
            statusType: '',
            imgSrc: '',
            id: '',
            streetAddress: '',
            zipcode: '',
            city: '',
            state: '',
            homeStatus: '',
            timeOnRedfin: '',
            is_FSBA: false,
            url: ''
        }
        const {
            price: { value: price = '' } = {},
            lotSize: { value: lot = 0 } = {},
            latLong: { value: latLong = {} } = {},
            searchStatus,
            propertyId,
            timeOnRedfin: { value: timeOnRedfinMs = NaN } = {},
            streetLine: { value: streetAddress = '' } = {},
            postalCode: { value: zipcode = '' } = {},
            city = '',
            state = '',
            mlsStatus: homeStatus,
            url: urlPath
        } = result
        let timeOnRedfinAsNumber: number
        if (timeOnRedfinMs) {
            timeOnRedfinAsNumber = Math.floor(moment.duration(timeOnRedfinMs).asDays())
        } else {
            timeOnRedfinAsNumber = result.timeOnRedfin ? 0 : NaN
        }
        const url = urlPath ? `https://www.redfin.com${urlPath}` : ''

        mappedResult = {
            ...mappedResult,
            price,
            lotAreaString: `${sqft2acre(lot)} acres`,
            ..._.pick(latLong, ['latitude', 'longitude']),
            statusType: searchStatus === 1 ? 'For Sale' : 'Sold',
            id: propertyId,
            streetAddress,
            zipcode,
            city,
            state,
            homeStatus,
            timeOnRedfin: `${timeOnRedfinAsNumber} day`,
            url
            // is_FSBA: result.marketingStatusSimplifiedCd === 'For Sale by Agent'
        }
        return mappedResult
    })
    const count = homes?.length ?? 'N/A'
    // const count = data?.cat1?.searchList?.totalResultCount ?? 'N/A'

    return { count, listings }
}

export const handleSearch = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, any>
) => {
    const { request, log } = crawlingContext
    const { query, searchUrl, region, status, lot, time } = request.userData

    const response = crawlingContext.response as IRequestResponse

    const requestInfo = {
        url: request.loadedUrl,
        searchUrl,
        query,
        region,
        status,
        lot,
        time
    }

    if (response.statusCode === 404) {
        globalContext.state.searchCount--
        log.info(`Page not found (404): ${request.url}`)
        return
    }

    const json = JSON.parse((response.body as any)?.replace('{}&&', ''))

    try {
        transformSearchData(json)
    } catch (e: any) {
        log.error(e.message, requestInfo)
    }
    const searchData = transformSearchData(json)

    if (!searchData) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no searchData', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no searchData: ${request.url}`)
    }
    const searchByText =
        request.userData.searchBy === 'state' ? getState(request.userData.query) : request.userData.query
    const daysKey = request.userData.status === 'Sold' ? 'soldInLast' : 'daysOnRedfin'

    globalContext.state.searchResults.push({
        ...DEFAULT_OUTPUT,
        ..._.pick(globalContext.input, ['county', 'state', 'zipCode']),
        [request.userData.searchBy]: searchByText,
        timeStamp: START_TIMESTAMP,
        status,
        [daysKey]: time,
        [OUTPUT_FIELDS.ACREAGE]: lotSizeToString(lot.min, lot.max),
        url: searchUrl,
        // timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        // proxy,
        // taskName: `${globalContext.input.scraper}/${searchByText}`,
        scraper: globalContext.input.scraper,
        ...searchData
    })
}
