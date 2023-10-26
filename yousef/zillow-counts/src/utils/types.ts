import { ProxyConfiguration } from 'apify'

import { RequestObject, RequestObjectArray } from '../base-utils'

import { LocationManager } from './location-manager'
import { TimeTracker } from './time-tracker'

export interface IInput {
    maxConcurrency?: number
    proxyConfiguration?: object
    ignoreStartRequests?: boolean
    ignoreAdditionalRequests?: boolean
    additionalRequests?: RequestObjectArray
    monitorPerformance?: boolean
    maxScrapedSearches?: number
    onlyCountProducts?: boolean
    headfull?: boolean
    [key: string]: any
}

export interface IFinalInput extends IInput {
    searchType: string
    proxyType: string
    scraper: string
    county: string
    state: string
    zipCode: string
    sessionsKvsName?: string
    sessions?: any[]
    dataSavingStoreType: string
    isTest: boolean
}

export interface IGlobalContextState extends IInput {
    searchCount: number
    searchResults: any[]
    smartproxyConsumption: any
}

export interface IGlobalContextShared {
    timeTracker: TimeTracker
    proxyConfiguration: ProxyConfiguration | undefined
    locationManager: LocationManager
    sessions: any[]
    defaultProxyUrls: string[]
    inUseOrBlockedProxies: string[]
    mapBounds: any
    region: any
    listingsResponses: {
        [key: string]: {
            listingPageNumber: number
            request: {
                url: string
                headers: any
                postData: string
            }
            json: any
            [key: string]: any
        }[]
    }
}

export interface ISearch {
    url?: string
    requestParams?: RequestObject

    [key: string]: any
}

export interface IRequestResponse {
    statusCode: number
    body: any

    [key: string]: any
}

export interface IRegion {
    id: string
    type: string
    lat: number
    lng: number
    city: string
    state: string
}

export interface IMapBounds {
    west: number
    east: number
    south: number
    north: number
}

export interface ILocation {
    query?: string
    mapBounds?: IMapBounds
    region?: IRegion
}
