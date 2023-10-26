import { IFinalInput } from './types'

export const getSearchQuery = (input: IFinalInput) => {
    const { county, searchType, state, zipCode } = input

    let query = county
    switch (searchType.toLowerCase()) {
        case 'zipcode':
            query = zipCode
            break
        case 'state':
            query = state
            break
    }
    return query
}
