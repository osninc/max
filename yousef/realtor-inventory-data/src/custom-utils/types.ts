import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IBaseInput } from '../utils'

export interface IInput extends IBaseInput {
    maxScrapedInventories?: number
}

export interface IFinalInput extends IInput, IBaseFinalInput {
    datasetId: string
    properties?: any[]
}

export interface IGlobalContextState extends IBaseGlobalContextState {
    inventoryCount: number
    inventoryResults: any[]
}

export interface IGlobalContextShared extends IBaseGlobalContextShared {}

export type InventoryGeoType = 'National' | string
export type InventoryKind = 'CurrentMonth' | 'Historical' | string
export type Inventory = {
    geoType: InventoryGeoType
    kind: InventoryKind
    csvUrl: string
}
