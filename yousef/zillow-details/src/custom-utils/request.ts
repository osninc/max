import { IFinalInput } from './types'
import { DESTINATION, ZILLOW_URL_PROPERTY } from './consts'

export const getRequestConfig = (destination: string, _input: IFinalInput, extraData?: any) => {
    let requestConfig: any = {}

    // if (isTest) {
    //     return getTestRegion(searchBy)
    // }
    const userData = {}
    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            Referer: 'https://www.zillow.com/',
            'Referrer-Policy': 'unsafe-url'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.PROPERTY: {
            const { zpid, propertyUrl } = extraData

            requestConfig = {
                ...baseConfig,
                url: ZILLOW_URL_PROPERTY.replace(/ZPID/g, zpid),
                userData: {
                    ...baseConfig.userData,
                    requestOptions: {
                        responseType: 'json'
                        // headerGeneratorOptions: { ...RANDOM_HEADERS }
                    }
                }
            }
            if (propertyUrl) {
                requestConfig.headers.Referer = propertyUrl
            }
            break
        }
        default:
            throw new Error(`Unknown destination: ${destination}`)
    }
    return requestConfig
}

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 ||
    (typeof body === 'string' && body?.includes('Request blocked')) ||
    (typeof body === 'object' && body?.blockScript?.includes('captcha'))
