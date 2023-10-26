import { createSessionFunctionBuilder, GlobalContext } from '../base-utils'

import { IMapBounds } from './types'
import { getSmartproxyProxyUrl } from './proxy'

export const createCoordinateGrid = (mapBounds: IMapBounds, gridSize = 2) => {
    const { east, west, north, south } = mapBounds

    const latitudeRange = east - west
    const longitudeRange = north - south

    const grid = []

    const longitudeStep = longitudeRange / gridSize
    const latitudeStep = latitudeRange / gridSize

    for (let lng = south; lng < north; lng += longitudeStep) {
        for (let lat = west; lat < east; lat += latitudeStep) {
            const cell = {
                east: lat + latitudeStep,
                west: lat,
                north: lng + longitudeStep,
                south: lng
            }
            grid.push(cell)
        }
    }

    return grid
}

export const createSessionFunctionBuilderCustom = (globalContext: GlobalContext<any, any, any>) => {
    return createSessionFunctionBuilder({
        websiteUrl: 'https://www.zillow.com/',
        // withProxyInfo: true
        extraRequestOptions: {
            headers: {
                Referer: 'https://www.zillow.com/',
                'Referrer-Policy': 'unsafe-url'
            }
        },
        proxyUrlBuilder: () => {
            let foundProxyUrl = false
            let proxyUrl: string | undefined

            while (!foundProxyUrl) {
                proxyUrl = getSmartproxyProxyUrl(globalContext.input)
                if (!globalContext.shared.inUseOrBlockedProxies.includes(proxyUrl)) {
                    foundProxyUrl = true
                }
            }
            return proxyUrl
        }
    })
}
