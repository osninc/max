import { sqft2acre } from "../../functions.js";

export const transformData2 = data => {
    return { count: ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A" }
}

export const transformData = data => {
    // REturn everything
    // Keep only the data we care about
    console.log("transformData 1")
    const propertiesFull = data.cat1.searchResults.listResults;
    console.log("transformData 2")
    const properties = propertiesFull.map(property => {
        // Time on zillow is milliseconds
        const lotArea = (property.hdpData?.homeInfo?.lotAreaUnit === "sqft") ? {
            lotAreaValue: sqft2acre(property.hdpData?.homeInfo?.lotAreaValue),
            lotAreaUnit: "acres",
        } : {
            lotAreaValue: property.hdpData?.homeInfo?.lotAreaValue,
            lotAreaUnit: property.hdpData?.homeInfo?.lotAreaUnit,
        }
        return {
            zpid: property.zpid,
            streetAddress: property.hdpData?.homeInfo?.streetAddress,
            zipcode: property.hdpData?.homeInfo?.zipcode,
            city: property.hdpData?.homeInfo?.city,
            state: property.hdpData?.homeInfo?.state,
            lat: property.hdpData?.homeInfo?.latitude,
            lon: property.hdpData?.homeInfo?.longitude,
            price: property.hdpData?.homeInfo?.price,
            lotAreaString: property.lotAreaString,
            ...lotArea,
            statusType: property.statusType,
            dateSold: property.hdpData?.homeInfo?.dateSold,
            timeOnZillow: property.timeOnZillow,
            detailUrl: property.detailUrl,
            image: property.imgSrc,
            unitOnZillow: property.variableData?.type,
            textOnZillow: property.variableData?.text
        }
    })
    return properties;
}