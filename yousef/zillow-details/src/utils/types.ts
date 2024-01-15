import { ProxyConfiguration } from 'apify'

import { RequestObject, RequestObjectArray } from '../base-utils'

import { LocationManager } from './location-manager'
import { TimeTracker } from './time-tracker'

export interface IBaseInput {
    maxConcurrency?: number
    proxyConfiguration?: object
    ignoreStartRequests?: boolean
    ignoreAdditionalRequests?: boolean
    additionalRequests?: RequestObjectArray
    monitorPerformance?: boolean
    onlyCountProducts?: boolean
    headfull?: boolean
    [key: string]: any
}

export interface IBaseFinalInput extends IBaseInput {
    proxyType: string
    scraper: string
    sessionsKvsName?: string
    sessions?: any[]
    isTest: boolean
}

export interface IBaseGlobalContextState extends IBaseInput {
    smartproxyConsumption: any
}

export interface IBaseGlobalContextShared {
    timeTracker: TimeTracker
    proxyConfiguration: ProxyConfiguration | undefined
    locationManager: LocationManager
    sessions: any[]
    defaultProxyUrls: string[]
    inUseOrBlockedProxies: string[]
    cache: Map<any, any>
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
