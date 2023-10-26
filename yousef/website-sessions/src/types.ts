import { Browser } from 'playwright-core'

import { RequestObjectArray } from './base-utils'

export interface IInput {
    websiteUrl?: string
    medium: string
    maxSessions?: number
    extraBlockFunc?: string
    maxConcurrency?: number
    solveCaptcha?: boolean
    proxyConfiguration?: object
    ignoreStartRequests?: boolean
    ignoreAdditionalRequests?: boolean
    additionalRequests?: RequestObjectArray
    monitorPerformance?: boolean
    [key: string]: any
}

export interface IFinalInput extends IInput {
    websiteUrl: string
    medium: string
}

export interface IGlobalContextState extends IInput {
    sessionCount: number
    smartproxyConsumption: any
}

export interface IGlobalContextShared {
    defaultProxyUrls: string[]
    inUseOrBlockedProxies: string[]
    browsers: { [k: string]: Browser }
}

export interface IExecuteRequestResponse {
    requestHeaders: { [key: string]: any }
    statusCode: number
    body?: string
    cookie?: string
    proxyUrl: string

    [key: string]: any
}
export interface ISession {
    articleNumber?: string

    [key: string]: any
}
