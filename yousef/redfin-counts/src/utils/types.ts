import { ProxyConfiguration } from 'apify'

import { RequestObject, RequestObjectArray } from '../base-utils'

import { LocationManager } from './location-manager'

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
}

export interface IFinalInput extends IInput {
    county: string
    proxy: string
    searchBy: string
    state: string
    zipCode: string
    scraper: string
    isTest: boolean
}

export interface IGlobalContextState extends IInput {
    searchCount: number
    searchResults: any[]
}

export interface IGlobalContextShared {
    runStartTime: DOMHighResTimeStamp
    runStopTime: DOMHighResTimeStamp
    proxyConfiguration: ProxyConfiguration | undefined
    locationManager: LocationManager
    proxyUrls: string[]
    inUseOrBlockedProxies: string[]
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
    body: string

    [key: string]: any
}
