import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IBaseInput } from '../utils'

export interface IInput extends IBaseInput {}

export interface IFinalInput extends IInput, IBaseFinalInput {
    searchType: string
    county: string
    state: string
    zipCode: string
    dataSavingStoreType: string
}

export interface IGlobalContextState extends IInput, IBaseGlobalContextState {
    searchCount: number
    searchResults: any[]
}

export interface IGlobalContextShared extends IBaseGlobalContextShared {
    mapBounds: any
    region: any
}
