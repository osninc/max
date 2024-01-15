import { Log } from 'crawlee'

import { alphaNum, ILocation, IPreRequest, lotSizeToString, sqft2acre } from '../utils'
import { getValidKey } from '../base-utils'
import { buildZillowUrl, LOT_SIZE, STATUS_MATRIX, TIME_MATRIX, ZILLOW, zoomParams } from '../utils/zillow'

import { IFinalInput } from './types'
import { DESTINATION, LABELS } from './consts'
import { getRequestConfig } from './request'

export const prepareSearchRequests = async (
    input: IFinalInput,
    log: Log,
    logInfo: any,
    location: ILocation,
    userData?: any
) => {
    const { searchType } = input

    const { query, mapBounds, region } = location

    if (!query || !mapBounds || !region) {
        log.error('Required data is missing:', { ...logInfo, query, mapBounds, region })
        throw new Error('prepareSearchRequests: Required data is missing!')
    }

    let additionalFilters: any = {}
    let searchParams: any = {}

    let statusMatrix: string[] = []
    let timeMatrix: string[][] = []
    let lotSize: string[][] = []

    if (input.isTest) {
        statusMatrix = ['For Sale']
        timeMatrix = [['36m', '36 months']]
        lotSize = [['', '']]
    } else {
        statusMatrix = STATUS_MATRIX
        timeMatrix = TIME_MATRIX
        lotSize = LOT_SIZE
    }

    const soldParams = {
        isForSaleByAgent: { value: false },
        isForSaleByOwner: { value: false },
        isNewConstruction: { value: false },
        isAuction: { value: false },
        isComingSoon: { value: false },
        isForSaleForeclosure: { value: false },
        isRecentlySold: { value: true },
        isAllHomes: { value: true }
    }

    const defaults = {
        pagination: {},
        isMapVisible: true,
        isListVisible: false,
        usersSearchTerm: alphaNum(query),
        mapZoom: 8,
        filterState: {
            sortSelection: { value: 'globalrelevanceex' },
            isLotLand: { value: true },
            isSingleFamily: { value: false },
            isTownhouse: { value: false },
            isMultiFamily: { value: false },
            isCondo: { value: false },
            isApartment: { value: false },
            isManufactured: { value: false },
            isApartmentOrCondo: { value: false }
        }
    }

    let extraMeta = {}

    // If it's a zipcode, need the city and state name
    if (searchType.toLowerCase() === 'zipcode')
        extraMeta = {
            cityState: `${region.city.replace(/ /gi, '-').toLowerCase()}-${region.state}`.toLowerCase()
        }

    if (!mapBounds) {
        const offset = 10

        extraMeta = {
            ...extraMeta,
            mapBounds: {
                north: region.lat + offset,
                south: region.lat - offset,
                west: region.lng - offset,
                east: region.lng + offset
            }
        }
    }

    const regionParams = {
        regionSelection: [
            {
                regionId: region.id,
                regionType: region.type
            }
        ],
        ...extraMeta
    }

    // @ts-ignore
    // const mapGrids: IMapBounds[] = createCoordinateGrid(mapBounds, 2)
    const searches: IPreRequest[] = []
    statusMatrix.forEach((status) => {
        additionalFilters = {}
        if (status === 'Sold') {
            additionalFilters = {
                ...soldParams
            }
        }
        timeMatrix.forEach((t) => {
            let timeFilter = {}
            timeFilter = {
                ...timeFilter,
                doz: { value: t[0] }
            }
            lotSize.forEach((lot) => {
                let newFilters: any = {}
                if (lot[0] !== '') {
                    newFilters = {
                        ...newFilters,
                        lotSize: {
                            min: Number(lot[0])
                        }
                    }
                }
                if (lot[1] !== '') {
                    newFilters = {
                        ...newFilters,
                        lotSize: {
                            ...newFilters.lotSize,
                            max: Number(lot[1])
                        }
                    }
                }

                const searchQueryState = {
                    ...regionParams,
                    mapBounds,
                    ...defaults,
                    mapZoom: zoomParams[searchType.toLowerCase()],
                    filterState: {
                        ...defaults.filterState,
                        ...additionalFilters,
                        ...timeFilter,
                        ...newFilters
                    }
                }
                searchParams = {
                    searchQueryState,
                    wants: ZILLOW.WANTS,
                    requestId: 1
                }

                const searchUrl = buildZillowUrl(status, searchQueryState, searchType)
                const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`
                const extraData = {
                    searchUrl,
                    searchParams,
                    status,
                    lot: lotStr,
                    time: t[1]
                }

                const requestConfig = getRequestConfig(DESTINATION.SEARCH, input, extraData)
                searches.push({
                    url: searchUrl,
                    requestParams: requestConfig
                })

                // mapGrids.forEach((mapGrid) => {
                //     searchQueryState.mapBounds = mapGrid
                //     const searchUrl = buildZillowUrl(status, searchQueryState, searchType)
                //     const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`
                //     const extraData = {
                //         searchUrl,
                //         searchParams,
                //         status,
                //         lot: lotStr,
                //         time: t[1]
                //     }
                //
                //     const requestConfig = getRequestConfig(DESTINATION.SEARCH, input, extraData)
                //     searches.push({
                //         url: searchUrl,
                //         requestParams: requestConfig
                //     })
                // })
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
