export const transformData = data => {
    const listings = (data?.cat1?.searchResults?.mapResults ?? []).map((result) => {
        let mappedResult = {
            price: '',
            lotAreaString: '',
            latitude: '',
            longitude: '',
            statusType: '',
            imgSrc: '',
            zpid: '',
            streetAddress: '',
            zipcode: '',
            city: '',
            state: '',
            homeStatus: '',
            daysOnZillow: '',
            is_FSBA: false
        }
        const { latitude, longitude } = result.latLong;
        const {
            streetAddress,
            zipcode,
            city,
            state,
            homeStatus,
            daysOnZillow } = result.hdpData?.homeInfo;
        mappedResult = {
            ...mappedResult,
            latitude,
            longitude,
            streetAddress,
            zipcode,
            city,
            state,
            homeStatus,
            daysOnZillow,
            price: result.price, 
            lotAreaString: result.lotAreaString, 
            statusType: result.statusType, 
            imgSrc: result.imgSrc, 
            zpid: result.zpid,
            is_FSBA: result.marketingStatusSimplifiedCd === 'For Sale by Agent'
        }
        return mappedResult
    })
        
    const agentCount = data?.categoryTotals?.cat1?.totalResultCount ?? 0;
    const otherCount = data?.categoryTotals?.cat2?.totalResultCount ?? 0; 
    const mapCount = listings?.length ?? 0
    //const count = ("totalResultCount" in data.categoryTotals.cat1) ? data.categoryTotals.cat1.totalResultCount : "N/A"

    return { agentCount, otherCount, mapCount, listings: (listings ? listings : []) };
}