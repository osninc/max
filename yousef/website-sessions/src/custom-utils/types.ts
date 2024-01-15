import { Browser } from 'playwright-core'

import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IBaseInput } from '../utils'

export interface IInput extends IBaseInput {
    websiteUrl?: string
    medium: string
    maxSessions?: number
    extraBlockFunc?: string
    solveCaptcha?: boolean
}

export interface IFinalInput extends IInput, IBaseFinalInput {
    websiteUrl: string
    medium: string
}

export interface IGlobalContextState extends IBaseGlobalContextState {
    sessionCount: number
}

export interface IGlobalContextShared extends IBaseGlobalContextShared {
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
    id?: string

    [key: string]: any
}
