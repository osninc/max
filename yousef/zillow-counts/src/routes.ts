import { BasicCrawlingContext, Dictionary, sleep } from 'crawlee'
import _ from 'lodash'

import { GlobalContext, persistResponseDataIntoRequest } from './base-utils'
import {
    DEFAULT_OUTPUT,
    getMapBoundsFromHtml,
    getValidKVSRecordKey,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    ILocation,
    IRequestResponse,
    OUTPUT_FIELDS,
    START_TIMESTAMP,
    ZILLOW
} from './utils'
import { prepareSearchRequests } from './custom-utils'

export const handleLocationMapBounds = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, any>
) => {
    const { request, log } = crawlingContext
    const { query } = request.userData
    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    }
    const response = crawlingContext.response as IRequestResponse

    const mapBounds = getMapBoundsFromHtml(response.body as any, log)

    if (!mapBounds) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no mapBounds', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no mapBounds: ${request.url}`)
    }

    globalContext.shared.mapBounds = mapBounds
}

export const handleLocationRegion = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const { request, crawler, log } = crawlingContext
    const { searchType } = globalContext.input
    const { query } = request.userData

    const requestInfo = {
        url: request.loadedUrl ?? request.url,
        query
    }

    const response = crawlingContext.response as IRequestResponse

    const data = (response.body as any)?.results

    if (!data?.length) {
        // Can't process without a region
        log.error('Error getting location data from zillow', requestInfo)
        throw new Error('Error getting location data from zillow')
    }

    // Only get the result of the county regionType
    const regionResults = data.filter((d: any) => d.metaData?.regionType?.toLowerCase() === searchType.toLowerCase())

    const { regionId, lat, lng, city: regionCity, state: regionState } = regionResults[0].metaData

    let mapBounds = globalContext.shared.mapBounds

    if (regionId === 0) {
        // Can't process without a region
        log.error('Error getting location data from zillow', requestInfo)
        throw new Error('Error getting location data from zillow')
    }
    // await Actor.pushData({ scraper, proxy, message: 'Error getting location data from zillow' })

    const regionType = (ZILLOW.REGION_TYPE as any)[searchType.toLowerCase()]

    const region = {
        id: regionId,
        type: regionType,
        lat,
        lng,
        city: regionCity,
        state: regionState
    }

    globalContext.shared.region = region

    let waitSecs = 0

    while (mapBounds === undefined) {
        await sleep(2000)
        waitSecs += 2
        if (waitSecs > 6) {
            break
        }
        mapBounds = globalContext.shared.mapBounds
    }
    const { locationManager } = globalContext.shared

    const location: ILocation = { query, mapBounds, region }
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

    await locationManager.cacheLocation(getValidKVSRecordKey(request.userData.query), location)

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
    const listings = (data?.cat1?.searchResults?.mapResults ?? []).map((result: any) => {
        let mappedResult = {
            price: '',
            lotAreaString: '',
            latitude: '',
            longitude: '',
            statusType: '',
            imgSrc: '',
            zpid: '',
            streetAddress: '',
            zipcode: '',
            city: '',
            state: '',
            homeStatus: '',
            daysOnZillow: '',
            is_FSBA: false
        }
        const { latLong = {}, hdpData = {} } = result
        const { homeInfo = {} } = hdpData
        mappedResult = {
            ...mappedResult,
            ..._.pick(latLong, ['latitude', 'longitude']),
            ..._.pick(homeInfo, [
                'latitude',
                'longitude',
                'streetAddress',
                'zipcode',
                'city',
                'state',
                'homeStatus',
                'daysOnZillow'
            ]),
            ..._.pick(result, ['price', 'lotAreaString', 'statusType', 'imgSrc', 'zpid']),
            is_FSBA: result.marketingStatusSimplifiedCd === 'For Sale by Agent'
        }
        return mappedResult
    })
    const agentCount = data?.categoryTotals?.cat1?.totalResultCount ?? 'N/A'
    const otherCount = data?.categoryTotals?.cat2?.totalResultCount ?? 'N/A'
    const mapCount = listings?.length ?? 'N/A'
    // const count = data?.cat1?.searchList?.totalResultCount ?? 'N/A'

    return { agentCount, otherCount, mapCount, listings }
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
        query,
        searchUrl,
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

    try {
        transformSearchData(response.body)
    } catch (e: any) {
        log.error(e.message, requestInfo)
    }
    const searchData = transformSearchData(response.body)

    if (!searchData) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no searchData', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no searchData: ${request.url}`)
    }
    // const searchTypeText =
    //     request.userData.searchType === 'state' ? getState(request.userData.query) : request.userData.query
    const daysKey = request.userData.status === 'Sold' ? 'soldInLast' : 'daysOnZillow'

    globalContext.state.searchResults.push({
        ...DEFAULT_OUTPUT,
        ..._.pick(globalContext.input, ['searchType', 'county', 'state', 'zipCode']),
        // [request.userData.searchType]: searchTypeText,
        timeStamp: START_TIMESTAMP,
        status,
        [daysKey]: time,
        [OUTPUT_FIELDS.ACREAGE]: lot,
        url: searchUrl,
        // timeToGetInfo: `${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        // proxy,
        // taskName: `${globalContext.input.scraper}/${searchTypeText}`,
        scraper: globalContext.input.scraper,
        ...searchData,
        '#debug': {
            proxyUrl: crawlingContext.session?.userData?.proxyUrl
        }
    })
}
