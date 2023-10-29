import axios from "axios";
import { APIFY, DETAILSDATASETS, STARTDETAILSACTOR } from "../constants/constants";
import { processError } from "../error";
import { convertDateToLocal, sec2min, time2epoch } from "../functions/functions";
import { getPropertyParams } from "../zillowGraphQl";
import { defaultHeaders } from "../headers.js";
import { normalizeTheData } from "./normalize";

export const fetchStore = async (storeId) => {
    try {
        const url = `${APIFY.inputs.realTime.replace("<STOREID>", storeId)}?token=${APIFY.base.token}`;
        const response = await axios.get(url);
        const data = response.data;
        // make this backwards compatible
        const search = (data.searchBy) ? data[data.searchBy] : data[data.searchType];
        return {
            searchBy: data.searchBy ? data.searchBy : data.searchType,
            search: search
        }
    }
    catch (error) {
        throw { message: processError("fetchStore", error) }
    }
}

export const fetchCountsData = async (id) => {
    try {
        const url = `${APIFY.datasets.realTime.replace("<DATASETID>", id)}?token=${APIFY.base.token}`
        //console.log({ url })
        const axiosObj = {
            method: APIFY.datasets.method,
            url
        }

        const response = await axios(axiosObj);
        const data = response.data

        const filteredData = data.filter(el => el.timeStamp)
        const listingsCount = filteredData.filter(el => el.mapCount !== "N/A").reduce((a, b) => a + b.mapCount, 0);
        const agentCount = filteredData.filter(el => el.agentCount !== "N/A").reduce((a, b) => a + b.agentCount, 0);
        return {
            counts: {
                listings: listingsCount,
                agent: agentCount
            }
        }
    }
    catch (error) {
        throw { message: processError("fetchListingsData", error) }
    }
}

const findAllDetailDatasets = async () => {
    // Check for at detail datasets
    const aryOfStoreIds = await getDetailsSuccessfulRuns()
    //const detailsSets = await findAllDetaillDatasetId()
    const aryOfResults = await Promise.all(aryOfStoreIds.map(async ({ datasetId, storeId }) => {
        const url = `${APIFY.listOfDetails.listOfInputs.replace("<STOREID>", storeId)}?token=${APIFY.base.token}&status=SUCCEEDED`;
        const response = await axios.get(url);
        const data = response.data
        return data.datasetId;
    }))
    return [...new Set(aryOfResults)]
}

const getCountsSuccessfulRuns = async () => {
    // Get a list of details datasets
    const detailsDatasets = await findAllDetailDatasets();

    const url = `${APIFY.base.url}${APIFY.runs.endPoint}?token=${APIFY.base.token}&status=SUCCEEDED&desc=true`;
    const response = await axios.get(url);
    const data = response.data;

    const aryOfItems = await Promise.all(data.data.items.map(async (item) => {
        const storeId = item.defaultKeyValueStoreId;
        const { searchBy, search } = await fetchStore(storeId);
        // fetch actual data for counts in dropdown (this is redundant TODO:)
        const { counts } = await fetchCountsData(item.defaultDatasetId)
        return {
            value: item.defaultDatasetId,
            searchBy: searchBy,
            search: search,
            date: convertDateToLocal(item.startedAt),
            epochTime: time2epoch(item.finishedAt),
            elapsedTime: sec2min(((time2epoch(item.finishedAt) - time2epoch(item.startedAt)) / 1000).toFixed(0)),
            counts,
            highlight: detailsDatasets.includes(item.defaultDatasetId),
            build: item.buildNumber,
            text: <><i>{searchBy}</i>:<strong>{search}</strong> <i>{convertDateToLocal(item.startedAt)}</i> <strong>{item.defaultDatasetId}</strong></>
        }
    }))

    // Filter out ones where both listing and agent numbers are zero
    return aryOfItems.filter(item => (item.counts.agent > 0) && (item.counts.listings > 0))
}


export const fetchDatasets = async () => {
    try {
        return await getCountsSuccessfulRuns()
    }
    catch (error) {
        throw { message: processError("fecthDatasets", error) }
    }
}

const findListingInObj = (obj, zpid) => {
    let foundElement = "";
    const d = Object.keys(obj).filter(el => el !== "meta").map(acreage => {
        Object.keys(obj[acreage]).map(time => {
            const ary = [...obj[acreage][time]["for sale"].listings, ...obj[acreage][time]["sold"].listings]

            if (foundElement === "") {
                foundElement = ary.find(e => e.zpid === zpid);
            }
        })
    })
    //console.log(fixElement(foundElement))
    return foundElement === "" ? {} : { data: { property: fixElement(foundElement) } };
}

const fixElement = el => {
    return {
        ...el,
        address: {
            city: el.city,
            state: el.state,
            streetAddress: el.streetAddress,
            zipcode: el.zipcode
        },
        priceHistory: el.priceHistory,
        pageViewCount: el.views,
        favoriteCount: el.favorites,
        unformattedPrice: el.unformattedPrice
    }
}

export const fetchDetailsData = async (counts, zpid) => {
    // Check if counts already has the details, if so, return that data
    if (counts.meta.hasDetails) {
        const returnObj = findListingInObj(counts, zpid)
        if (Object.keys(returnObj).length > 0) {
            return returnObj;
        }
    }

    const url = APIFY.details.realTime

    const graphQlParams = getPropertyParams(zpid)

    let baseConfig = {
        headers: {
            ...defaultHeaders,
            Referer: "https://www.zillow.com/",
            "Referrer-Policy": "unsafe-url"
        },
        responseType: "json"
    }

    try {

        const response = await axios.post(url, graphQlParams, baseConfig)
        const data = response.data

        return data;
    } catch (error) {
        try {
            // getting backup
            const url = APIFY.details.backup

            // Prepare Actor input
            const input = {
                zpid,
                proxy: "residential",
            };

            const response = await axios.post(url, input);
            const data = response.data;
            return data[0];
        }
        catch (error2) {
            throw { message: processError("fetchDetailsData", error2) }
        }
    }
}

const getDetailsSuccessfulRuns = async () => {
    // Get a list of runs
    const url = `${APIFY.listOfDetails.listOfRuns}?token=${APIFY.base.token}&status=SUCCEEDED`;

    const response = await axios.get(url);
    const data = response.data

    // Returns a list of storeId and datasetIds
    return data.data.items.map(d => {
        return {
            datasetId: d.defaultDatasetId,
            storeId: d.defaultKeyValueStoreId
        }
    });
}

const findDetailsDatasetsByRunDatasetId = async (aryOfStoreIds, ds) => {
    const aryOfResults = await Promise.all(aryOfStoreIds.map(async ({ datasetId, storeId }) => {
        const url = `${APIFY.listOfDetails.listOfInputs.replace("<STOREID>", storeId)}?token=${APIFY.base.token}&status=SUCCEEDED`;
        const response = await axios.get(url);
        const data = response.data
        if (data.datasetId === ds)
            return datasetId
    }))

    // filter out null and undefined elements 
    const newAry = aryOfResults.filter(el => el)

    // Return the latest one if there are results
    return newAry;//.length > 0 ? newAry[0] : ""
}

const findCountsDatasetIdByInput = (aryOfRuns, search) => {
    if (!aryOfRuns) return "";

    const obj = aryOfRuns.find(run => run.search === search)

    return obj ? obj.value : ""
}

const findDetailsRunByDatasetId = async (ds) => {
    // Get a list of successful runs
    const listOfStoreIds = await getDetailsSuccessfulRuns();

    // find which store has the input of the current datasetId
    // Returns array
    const runDatasetId = await findDetailsDatasetsByRunDatasetId(listOfStoreIds, ds)

    return runDatasetId.length > 0 ? runDatasetId[0] : "";
}

export const fetchDetails = async (ds) => {
    const theDatasetId = await findDetailsRunByDatasetId(ds);

    // if array is zero length, then there isn't a match, launch the actor
    if (theDatasetId !== "") {
        const url = `${APIFY.listOfDetails.datasetItems.replace("<DATASETID>", theDatasetId)}?token=${APIFY.base.token}`;
        const response = await axios.get(url);
        const data = response.data
        return data
    }
    else {
        // don't have to accidentally run the actor so I'll put a flag here
        console.log("Launching new actor with dataset")
        console.log({ STARTDETAILSACTOR })
        console.log(`if true, then sending`)
        console.log(`datasetId: ${ds}`)
        if (STARTDETAILSACTOR) {// Run actor async without waiting
            const url4 = `${APIFY.listOfDetails.listOfRuns}?token=${APIFY.base.token}&build=0.1.15`
            const inputParams = {
                datasetId: ds
            }
            // POST runs the actor with the params
            const response4 = await axios.post(url4, inputParams);
            console.log({ response4 })
            // don't have to wait
        }
    }
}

// This is the main search function
export const fetchData = async (params) => {
    const { 
        search, 
        ds, 
        buildNumber,
        proxyType,
        scraper,
        forceCleanSessionsCreation,
        maxConcurrency,
        dataSavingStoreType
     } = params

     let tempDs = ds;

    let searchBy = "county"
    // figure out what kind of search it is
    if (search.length === 2)
        searchBy = "state"
    if (search.length === 5)
        searchBy = "zipCode"

    // Prepare Actor input
    const input = (buildNumber.includes("yir-dev-2") || buildNumber.includes("0.2.")) ? // use old inputs
        {
            searchBy,
            [searchBy]: search,
            proxyType: proxyType.toLowerCase(),
            scraper: scraper.toLowerCase(),
            "debug": false
        } : {
            searchType: searchBy,
            [searchBy]: search,
            proxyType,
            scraper,
            debug: false,
            forceCleanSessionsCreation,
            maxConcurrency,
            dataSavingStoreType
        };

    let axiosObj;

    // Check to see if there is an existing Dataset for this search within the last X days
    if (tempDs === "") {
        const existingDs = await findExistingDataset(search)
        if (existingDs !== "")
            tempDs = existingDs
    }

    if (tempDs === "") {
        const url = `${APIFY.base.url}${APIFY.counts.endPoint}?token=${APIFY.base.token}&build=${buildNumber}`;

        axiosObj = {
            data: input,
            method: APIFY.counts.method,
            url
        }
    }
    else {
        const url = `${APIFY.datasets.realTime.replace("<DATASETID>", tempDs)}?token=${APIFY.base.token}`

        axiosObj = {
            method: APIFY.datasets.method,
            url
        }
    }

    try {
        const response = await axios(axiosObj);
        const data = response.data

        // Get the name of area
        // Pre-fill all variables
        const data1 = data[1];
        let newSearch = search;
        if (data1["county"] !== "") {
            newSearch = data1["county"];
            searchBy = "county"
        }
        if (data1["zipCode"] !== "") {
            newSearch = data1["zipCode"];
            searchBy = "zipCode"
        }
        if (data1["state"] !== "") {
            newSearch = data1["state"];
            searchBy = "state"
        }

        // See if this version has a datasetId in the return JSON
        // Check to see if there are any details already in the system for this dataset ID, if not, then launch a task

        let listingsDetails;
        // is there a datasetId in this dataset? if not, then get from param if any
        const thisDatasetId = data[0]?.datasetId ?? tempDs;

        if (thisDatasetId) {
            listingsDetails = await fetchDetails(thisDatasetId)
        }
        const normalizedData = normalizeTheData(data, listingsDetails)

        return {
            data: normalizedData,
            area: newSearch,
            date: data[1]?.timeStamp,
            searchBy
        }

    } catch (error) {
        throw { message: processError("fetchData", error) }
    }
}

const findExistingDataset = async (search) => {
    // Get list of successful runs
    const listOfRuns = await getCountsSuccessfulRuns();
    // Filter the runs by last X days
    const someDaysAgo = new Date(Date.now() - APIFY.counts.pastDays * 24 * 60 * 60 * 1000)
    const runFromSomeDaysAgo = listOfRuns.filter(run => {
        return (run.epochTime >= someDaysAgo)
    })

    // Find what input it was
    const existingDs = await findCountsDatasetIdByInput(runFromSomeDaysAgo, search)
    // Return datasetId of the successful run where input is the same as "search"
    return existingDs
}