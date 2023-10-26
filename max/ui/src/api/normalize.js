import { calcAbsorption, calcDom, calcMos, calcPpa, calcRatio, getListOfField, getSum } from "../functions/formulas";
import { convertPriceStringToFloat, convertStrToAcre } from "../functions/functions";

const calcAvgPrice = ary => {
    if ((typeof ary === 'undefined') || (ary.length === 0)) return 0;

    const listOfPrices = getListOfField(ary, "unformattedPrice")
    const totalPrices = getSum(listOfPrices)
    const numListings = listOfPrices.length;

    return (numListings === 0) ? 0 : parseInt((totalPrices / numListings).toFixed(0));
}

const calcAvg = ary => {
    if ((typeof ary === 'undefined') || (ary.length === 0)) return 0;

    const total = getSum(ary)
    const num = ary.length;

    // if (isNaN(total))
    //   console.log({ ary })

    return (num === 0) ? 0 : parseFloat((total / num).toFixed(2));
}

const calcAvgPpa = ary => {
    if ((typeof ary === 'undefined') || (ary.length === 0)) return 0;

    const listOfPpa = getListOfField(ary, "unformattedPpa")
    const totalPpa = getSum(listOfPpa)
    const numListings = listOfPpa.length;

    return (numListings === 0) ? 0 : parseInt((totalPpa / numListings).toFixed(0));
}

const fixListings = (listings, details) => {
    const f = listings.map(listing => {
        const newPrice = convertPriceStringToFloat(listing.price)
        const newAcre = convertStrToAcre(listing.lotAreaString)
        const newPpa = calcPpa(newPrice, newAcre);
        //console.log({ newPpa })
        // replace all google images
        const newImage = (listing.imgSrc.includes("googleapis.com")) ? "/no-image.png" : listing.imgSrc

        let secondaryDetails = {}
        // find listings // There are some records that has no zpid
        if (details)
            if (listing.zpid)
                secondaryDetails = details[listing.zpid]
            else
                secondaryDetails = {
                    dom: "N/A",
                    views: "N/A",
                    favorites: "N/A",
                    saves: "N/A"
                }

        return {
            ...listing,
            unformattedPrice: newPrice,
            acre: newAcre,
            unformattedPpa: newPpa,
            imgSrc: newImage,
            originalImgSrc: listing.imgSrc,
            ...secondaryDetails
        }
    })
    return f
}

const fixDetails = details => {
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

export const normalizeTheData = (data, details) => {
    // if there are details array, then process that one first before merge
    let fixedDetails
    const checkForDetails = details ? false : true;
    if (details)
        fixedDetails = fixDetails(details);

    let c = {}
    // Put everything in an object to reference faster and easier
    data.map((count, i) => {
        if (count.status !== undefined) {
            const timeDim = (count.status?.toLowerCase() === "sold") ? count?.soldInLast?.toLowerCase() : count?.daysOnZillow?.toLowerCase();

            if (timeDim) {
                const fixedListings = fixListings(count.listings, fixedDetails);
                const listOfPrices = getListOfField(fixedListings, "unformattedPrice")
                const numPrices = listOfPrices.length
                const listingsWithValues = {
                    dom: fixedListings.filter(l => l.dom !== "N/A").map(listing => listing.dom).filter(el => el),
                    views: fixedListings.filter(l => l.views !== "N/A").map(listing => listing.views).filter(el => el),
                    favorites: fixedListings.filter(l => l.favorites !== "N/A").map(listing => listing.favorites).filter(el => el),
                }
                c[count.acreage?.toLowerCase()] = {
                    ...c[count.acreage?.toLowerCase()],
                    [timeDim.toLowerCase()]: {
                        ...(c[count.acreage?.toLowerCase()] ? c[count.acreage?.toLowerCase()][timeDim?.toLowerCase()] : {}),
                        timeStamp: count.timeStamp,
                        [count.status?.toLowerCase()]: {
                            count: count.agentCount,
                            url: count.url,
                            listings: fixedListings,
                            numPrices,
                            sumPrice: getSum(listOfPrices),
                            mapCount: count.mapCount,
                            otherCount: count.otherCount,
                            avgPrice: calcAvgPrice(fixedListings),
                            avgPpa: calcAvgPpa(fixedListings),
                            avgDom: calcAvg(listingsWithValues.dom),
                            domCount: listingsWithValues.dom.length
                        }

                    }
                }
            }
        }
        return {}
    })

    // Added calculated values
    Object.keys(c).map(acreage => {
        Object.keys(c[acreage]).map(time => {
            c[acreage][time] = {
                ...c[acreage][time],
                ratio: calcRatio(c[acreage][time]["for sale"]?.count, c[acreage][time]["sold"]?.count),
                mos: calcMos(c[acreage][time]["for sale"]?.count, c[acreage][time]["sold"]?.count, time),
                absorption: calcAbsorption(c[acreage][time]["for sale"]?.count, c[acreage][time]["sold"]?.count, time)

            }
            return {};
        });
        return {};
    })

    // Add any meta fields
    c = {
        ...c,
        meta: {
            hasDetails: (details) ? true : false,
            checkForDetails
        }
    }

   // console.log({ c })

    return c
};
