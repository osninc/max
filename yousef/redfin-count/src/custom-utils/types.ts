import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IBaseInput } from '../utils'

export interface IInput extends IBaseInput {
    maxScrapedProperties?: number
}

export interface IFinalInput extends IInput, IBaseFinalInput {
    datasetId: string
    properties?: any[]
}

export interface IGlobalContextState extends IBaseGlobalContextState {
    searchCount: number
    searchResults: any[]
}

export interface IGlobalContextShared extends IBaseGlobalContextShared {
    region: any
}
