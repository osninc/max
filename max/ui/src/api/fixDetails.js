import { calcDom } from "../functions/formulas"

export const fixDetails = details => {
    let obj = {}
    const d = details.filter(d => d.zpid).map(detail => {
        //console.log({ detail })
        const dom = calcDom(detail.priceHistory)
        obj = {
            ...obj,
            [detail.zpid.toString()]: {
                dom,
                //...detail,
                agent: {
                    name: detail.attributionInfo?.agentName,
                    number: detail.attributionInfo?.agentPhoneNumber,
                    email: detail.attributionInfo?.agentEmail,
                    licenseNumber: detail.attributionInfo?.agentLicenseNumber,
                },
                broker: {
                    name: detail.attributionInfo?.brokerName,
                    number: detail.attributionInfo?.brokerPhoneNumber
                },
                parcelNumber: detail.resoFacts?.parcelNumber,
                views: detail.pageViewCount,
                favorites: detail.favoriteCount,
                saves: "N/A",
                description: detail.description,
                priceHistory: detail.priceHistory,
                lotAreaValue: detail.lotAreaValue,
                lotAreaUnits: detail.lotAreaUnits,
            }
        }
        //console.log({ obj })
        return obj;
    })

    return obj
}