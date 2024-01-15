import { FOR_SALE_TIME_FOR_URL, LOT_SIZE_FOR_URL } from './consts'

export const buildSearchUrl = (params: any) => {
    const { slug, status, lot, time } = params

    // https://www.realtor.com/realestateandhomes-search/Washington/type-land/lot-sqft-2000-21780/dom-7?view=map
    // https://www.realtor.com/realestateandhomes-search/Washington/type-land/show-recently-sold/lot-sqft-2000-21780?view=map
    let finalPath = `https://www.realtor.com/realestateandhomes-search/${slug}/type-land`
    if (status === 'Sold') {
        finalPath += '/show-recently-sold'
    }
    if (lot.min) {
        finalPath += `/lot-sqft-${LOT_SIZE_FOR_URL[lot.min as keyof typeof LOT_SIZE_FOR_URL]}`
    }
    if (lot.max) {
        finalPath += `/lot-sqft-${lot.min ? LOT_SIZE_FOR_URL[lot.min as keyof typeof LOT_SIZE_FOR_URL] : 0}-${
            LOT_SIZE_FOR_URL[lot.max as keyof typeof LOT_SIZE_FOR_URL]
        }`
    }
    if (status === 'For Sale') {
        time > 1 && (finalPath += `/dom-${FOR_SALE_TIME_FOR_URL[time as keyof typeof FOR_SALE_TIME_FOR_URL]}`)
        finalPath += '/sby-6'
    }
    finalPath += '?view=map'
    return finalPath
}
