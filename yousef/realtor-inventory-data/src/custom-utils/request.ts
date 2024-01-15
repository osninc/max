import { RANDOM_HEADERS } from '../utils'

import { IFinalInput, Inventory } from './types'
import { DESTINATION } from './consts'

export const getRequestConfig = (destination: string, _input: IFinalInput, extraData?: any) => {
    let requestConfig: any = {}

    // if (isTest) {
    //     return getTestRegion(searchBy)
    // }
    const userData = {}

    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'referrer-policy': 'strict-origin-when-cross-origin'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.CSV_LISTING: {
            const url = 'https://www.realtor.com/research/data/'
            requestConfig = {
                ...baseConfig,
                url,
                headers: {
                    ...baseConfig.headers,
                    // eslint-disable-next-line max-len
                    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'en-US,en;q=0.9',
                    'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Linux"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1'
                }
            }
            // requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break
        }
        case DESTINATION.CSV_DOWNLOAD: {
            const { geoType, kind, csvUrl } = (extraData ?? {}) as Inventory

            requestConfig = {
                ...baseConfig,
                url: csvUrl,
                headers: {
                    ...baseConfig.headers,
                    'upgrade-insecure-requests': '1'
                },
                userData: {
                    inventory: {
                        geoType,
                        kind,
                        csvUrl
                    }
                }
            }
            requestConfig.userData.requestOptions = {
                responseType: 'buffer',
                headerGeneratorOptions: { ...RANDOM_HEADERS }
                // searchParams: {
                //     ...searchParams,
                //     requestId
                // }
            }

            break
        }
        default:
            throw new Error(`Unknown destination: ${destination}`)
    }
    return requestConfig
}

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 || (typeof body === 'string' && body?.includes('Request blocked'))
