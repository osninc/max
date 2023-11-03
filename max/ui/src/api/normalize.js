import { calcAbsorption, calcDom, calcMos, calcPpa, calcRatio, getListOfField, getSum } from "../functions/formulas";
import { USDollar, convertPriceStringToFloat, convertStrToAcre } from "../functions/functions";

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
        //console.log({listing})
        const newPrice = convertPriceStringToFloat(listing.price.toString())
        const newAcre = convertStrToAcre(listing.lotAreaString)
        const newPpa = calcPpa(newPrice, newAcre);
        //console.log({ newPpa })
        // replace all google images
        const newImage = (listing.imgSrc.includes("googleapis.com")) || (listing.imgSrc === "") ? "/no-image.png" : listing.imgSrc
        const newId = listing.zpid ?? listing.id

        let secondaryDetails = {}
        // find listings // There are some records that has no zpid
        if (details)
            if (newId)
                secondaryDetails = details[newId]
            else
                secondaryDetails = {
                    dom: "N/A",
                    views: "N/A",
                    favorites: "N/A",
                    saves: "N/A"
                }

        return {
            ...listing,
            zpid: newId,
            price: USDollar.format(newPrice),
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

    // Some default calculated fields
    const defaultCalcFields = {
        count: 0,
        url: "",
        listings: [],
        numPrices: 0,
        sumPrice: 0,
        mapCount: 0,
        otherCount: 0,
        avgPrice: 0,
        avgPpa: 0,
        avgDom: 0,
        domCount: 0
    }

    // Put everything in an object to reference faster and easier
    data.map((count, i) => {
        if (count.status !== undefined) {
            const timeDim = (count.status?.toLowerCase() === "sold") ? count?.soldInLast?.toLowerCase() : count?.daysOn?.toLowerCase();

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
                            count: count.agentCount ?? count.count,
                            url: count.url,
                            listings: fixedListings,
                            numPrices,
                            sumPrice: getSum(listOfPrices),
                            mapCount: count.mapCount ?? 0,
                            otherCount: count.otherCount ?? 0,
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
            // Check if there are both for sale and sold object, else add empty obj
            let missingObj = {}
            const hasFs = c[acreage][time]["for sale"] ? true : false
            const hasSold = c[acreage][time]["sold"] ? true : false
            if (!hasFs) {
                missingObj = {
                    ...missingObj,
                    ["for sale"]: {...defaultCalcFields}
                }
            }
            if (!hasSold) {
                missingObj = {
                    ...missingObj,
                    ["sold"]: { ...defaultCalcFields }
                }
            }
            // Add this so it can calculate in the next steps
            c[acreage][time] = {
                ...c[acreage][time],
                ...missingObj
            }

            c[acreage][time] = {
                ...c[acreage][time],
                ratio: calcRatio(c[acreage][time]["for sale"].count, c[acreage][time]["sold"].count),
                mos: calcMos(c[acreage][time]["for sale"].count, c[acreage][time]["sold"].count, time),
                absorption: calcAbsorption(c[acreage][time]["for sale"].count, c[acreage][time]["sold"].count, time)

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

    //console.log({ c })

    return c
};
