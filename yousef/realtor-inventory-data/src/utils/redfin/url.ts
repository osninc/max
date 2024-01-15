import { FOR_SALE_TIME_FOR_URL, LOT_SIZE_FOR_URL, SOLD_TIME_FOR_URL } from './consts'

export const buildSearchUrl = (params: any) => {
    const { region, status, lot, time } = params

    // http://www.redfin.com/city/9168/NJ/Jersey-City/filter/sort=lo-days,property-type=land,min-lot-size=2k-sqft,max-lot-size=0.25-acre,include=sold-3mo
    let finalPath = `${region.url}/filter/sort=lo-days,property-type=land`
    if (status === 'For Sale') {
        finalPath += `,${time.startsWith('-') ? 'min' : 'max'}-days-on-market=${
            FOR_SALE_TIME_FOR_URL[time as keyof typeof FOR_SALE_TIME_FOR_URL]
        }`
    }
    if (lot.min) {
        finalPath += `,min-lot-size=${LOT_SIZE_FOR_URL[lot.min as keyof typeof LOT_SIZE_FOR_URL]}`
    }
    if (lot.max) {
        finalPath += `,max-lot-size=${LOT_SIZE_FOR_URL[lot.max as keyof typeof LOT_SIZE_FOR_URL]}`
    }
    if (status === 'Sold') {
        finalPath += `,include=sold-${SOLD_TIME_FOR_URL[time as keyof typeof SOLD_TIME_FOR_URL]}`
    }
    return finalPath
}
