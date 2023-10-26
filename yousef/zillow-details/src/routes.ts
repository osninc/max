import { BasicCrawlingContext, Dictionary } from 'crawlee'
import _ from 'lodash'
import { Actor } from 'apify'

import { GlobalContext, persistResponseDataIntoRequest } from './base-utils'
import { IRequestResponse, START_TIMESTAMP } from './utils'
import { DEFAULT_OUTPUT, IFinalInput, IGlobalContextState } from './custom-utils'

export const handleProperty = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, any>
) => {
    const { request, log } = crawlingContext
    const { property } = request.userData

    const response = crawlingContext.response as IRequestResponse

    const requestInfo = {
        url: request.loadedUrl,
        property
    }

    if (response.statusCode === 404) {
        globalContext.state.propertyCount--
        log.info(`Page not found (404): ${request.url}`)
        return
    }

    const propertyItem = response?.body?.data?.property

    if (!propertyItem) {
        persistResponseDataIntoRequest({ crawlingContext })
        log.error('Page has no property', {
            requestInfo
        })
        crawlingContext.request.noRetry = true
        throw new Error(`Page has no property: ${request.url}`)
    }

    // const propertyData = {
    //     zpid: property?.zpid,
    //     imgSrc: property?.hiResImageLink,
    //     detailUrl: `https://www.zillow.com${property?.hdpUrl}`,
    //     statusText: property?.homeStatus,
    //     unformattedPrice: property?.price,
    //     address: `${property?.streetAddress} ${property?.regionString}`,
    //     addressStreet: property?.streetAddress,
    //     addressCity: property?.address?.city,
    //     addressState: property?.address?.state,
    //     addressZipcode: property?.address?.zipcode,
    //     lotAreaString: property?.resoFacts?.lotSize,
    //     beds: property?.bedrooms,
    //     baths: property?.bathrooms,
    //     area: property?.livingAreaUnits,
    //     // latLong,
    //     // type: variableData?.type,
    //     // variableDataText: variableData?.text,
    //     // dateSold: hdpData?.homeInfo?.dateSold,
    //     lotAreaUnit: property?.lotAreaUnits,
    //     is_pending: property?.listing_sub_type?.is_pending,
    //     parcelNumber: property?.resoFacts?.parcelNumber,
    //     mlsName: property?.attributionInfo?.mlsName,
    //     agentEmail: property?.attributionInfo?.agentEmail,
    //     agentLicenseNumber: property?.attributionInfo?.agentLicenseNumber,
    //     agentName: property?.attributionInfo?.agentName,
    //     agentPhoneNumber: property?.attributionInfo?.agentPhoneNumber,
    //     attributionTitle: property?.attributionInfo?.attributionTitle,
    //     brokerName: property?.attributionInfo?.brokerName,
    //     brokerPhoneNumber: property?.attributionInfo?.brokerPhoneNumber,
    //     buyerAgentMemberStateLicense: property?.attributionInfo?.buyerAgentMemberStateLicense,
    //     buyerAgentName: property?.attributionInfo?.buyerAgentName,
    //     buyerBrokerageName: property?.attributionInfo?.buyerBrokerageName,
    //     coAgentLicenseNumber: property?.attributionInfo?.coAgentLicenseNumber,
    //     coAgentName: property?.attributionInfo?.coAgentName,
    //     mlsId: property?.attributionInfo?.mlsId,
    //     priceHistory: property?.priceHistory.map((price: any) => ({
    //         date: price.date,
    //         time: price.time,
    //         price: price.price,
    //         pricePerSquareFoot: price.pricePerSquareFoot,
    //         priceChangeRate: price.priceChangeRate,
    //         event: price.event
    //     })),
    //     description: property?.description,
    //     timeOnZillow: property?.timeOnZillow,
    //     pageViewCount: property?.pageViewCount,
    //     favoriteCount: property?.favoriteCount,
    //     daysOnZillow: property?.daysOnZillow,
    //     latitude: property?.latitude,
    //     longitude: property?.longitude,
    //     monthlyHoaFee: property?.monthlyHoaFee,
    //     lotSize: property?.lotSize,
    //     lotAreaValue: property?.lotAreaValue,
    //     lotAreaUnits: property?.lotAreaUnits
    // }

    const propertyData = {
        address: _.pick(propertyItem?.address ?? {}, ['city', 'state', 'streetAddress', 'zipcode']),
        ..._.pick(propertyItem ?? {}, [
            'dateSold',
            'hdpUrl',
            'homeStatus',
            'lastSoldPrice',
            'latitude',
            'longitude',
            'lotSize',
            'price',
            'yearBuilt',
            'zestimate',
            'zpid',
            'lotAreaValue',
            'lotAreaUnits',
            'timeOnZillow',
            'pageViewCount',
            'favoriteCount',
            'daysOnZillow',
            'description',
            'brokerId',
            'brokerageName',
            'mlsid',
            'monthlyHoaFee'
        ]),
        priceHistory:
            propertyItem?.priceHistory?.map((ph: any) =>
                _.pick(ph, ['date', 'time', 'price', 'event', 'buyerAgent', 'sellerAgent'])
            ) ?? null,
        resoFacts: _.pick(propertyItem?.resoFacts ?? {}, ['parcelNumber']),
        attributionInfo: _.pick(propertyItem?.attributionInfo ?? {}, [
            'mlsName',
            'agentEmail',
            'agentLicenseNumber',
            'agentName',
            'agentPhoneNumber',
            'attributionTitle',
            'brokerName',
            'brokerPhoneNumber',
            'buyerAgentMemberStateLicense',
            'buyerAgentName',
            'buyerBrokerageName',
            'coAgentLicenseNumber',
            'coAgentName',
            'coAgentNumber',
            'mlsId'
        ])
    }
    const propertyFinalData = {
        ...DEFAULT_OUTPUT,
        ...propertyData,
        // url: `https://www.zillow.com${propertyData?.hdpUrl}`,,
        timeStamp: START_TIMESTAMP
    }
    globalContext.state.properties.set(`${property.zpid}`, propertyFinalData)
    await Actor.pushData(propertyFinalData)
}
