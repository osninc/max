import { getCounty } from './county'
import { getState } from './state'
import { IBaseFinalInput } from './types'
import { START_TIMESTAMP } from './consts'
import { getValidKVSRecordKey } from './atom'

export const getSearchInfo = (input: IBaseFinalInput) => {
    const { county, searchType, state, zipCode } = input

    let geo = ''
    let code = ''
    switch (searchType.toLowerCase()) {
        case 'state':
            geo = 'S'
            const stateItem = getState(state)
            code = stateItem?.fips ?? `NA-${state}`
            break
        case 'county':
            geo = 'C'
            const countyItem = getCounty(county)
            code = countyItem?.fips ?? `NA-${county}`
            break
        case 'zipcode':
            geo = 'Z'
            code = zipCode
            break
    }
    return {
        geo,
        code
    }
}
export const getDatasetName = (input: IBaseFinalInput, prefix: string) => {
    const searchInfo = getSearchInfo(input)
    const datasetName = getValidKVSRecordKey(`${prefix}-${searchInfo.geo}-${searchInfo.code}-${START_TIMESTAMP}`)
    return datasetName
}

export const DATA_SAVING_STORE_TYPE = {
    KVS: 'KVS',
    DATASET: 'DATASET'
}
