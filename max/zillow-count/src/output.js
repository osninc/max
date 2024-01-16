import { getCounty } from './county'
import { getStateFips } from './state'

export const getSearchInfo = (input) => {
    const { county, searchType, state, zipCode } = input

    let geo = ''
    let code = ''
    switch (searchType.toLowerCase()) {
        case 'state':
            geo = 'S'
            const stateItem = getStateFips(state)
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
export const getDatasetName = (input, prefix) => {
    const searchInfo = getSearchInfo(input)
    const datasetName = getValidKVSRecordKey(`${prefix}-${searchInfo.geo}-${searchInfo.code}-${START_TIMESTAMP}`)
    return datasetName
}

export const DATA_SAVING_STORE_TYPE = {
    KVS: 'KVS',
    DATASET: 'DATASET'
}
