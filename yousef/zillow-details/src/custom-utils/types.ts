import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IBaseInput } from '../utils'

export interface IInput extends IBaseInput {
    maxScrapedProperties?: number
    [key: string]: any
}

export interface IFinalInput extends IInput, IBaseFinalInput {
    datasetId: string
    properties?: any[]
}

export interface IGlobalContextState extends IBaseGlobalContextState {
    propertyCount: number
    properties: Map<string, any>
}

export interface IGlobalContextShared extends IBaseGlobalContextShared {}
