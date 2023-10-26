import { Actor } from 'apify'
import _ from 'lodash'

import { getValidKey, labeledLog } from '../base-utils'
import { LABELS } from '../consts'

import { IFinalInput } from './types'
import { getRequestConfig } from './request'
import { DESTINATION } from './consts'

export const preparePropertyRequests = async (input: IFinalInput) => {
    const log = labeledLog({ label: 'preparePropertyRequests' })

    const { datasetId, properties: inputProperties } = input
    const logInfo = { datasetId, properties: inputProperties }

    if (!datasetId || (inputProperties && !Array.isArray(inputProperties))) {
        log.error('Required data is missing:', { ...logInfo })
        throw new Error('preparePropertyRequests: Required data is missing!')
    }
    let finalProperties: any[]
    if (Array.isArray(inputProperties) && inputProperties.length) {
        finalProperties = inputProperties.map((p: any) => {
            return _.pick(p, ['zpid', 'url'])
        })
    } else {
        const datasetItems = await Actor.apifyClient.dataset(datasetId).listItems()
        const allProperties = datasetItems.items
            .reduce((acc, curr: any) => {
                if (curr.listings) {
                    return acc.concat(curr.listings.filter((p: any) => !!p.zpid))
                }
                return acc
            }, [])
            .map((p: any) => {
                return _.pick(p, ['zpid', 'url'])
            })
        finalProperties = _.uniqBy(allProperties, 'zpid')
    }

    const propertyRequests = finalProperties.map((property) => {
        const { zpid, url: propertyUrl } = property
        const requestConfig = getRequestConfig(DESTINATION.PROPERTY, input, { zpid, propertyUrl })
        const userData = requestConfig.userData
        const key = `${zpid}`
        return {
            ..._.omit(requestConfig, ['userData']),
            uniqueKey: getValidKey(`${LABELS.PROPERTY}_${key}`),
            userData: {
                label: LABELS.PROPERTY,
                ...userData,
                property: { zpid, propertyUrl }
            }
        }
    })

    return propertyRequests
}
