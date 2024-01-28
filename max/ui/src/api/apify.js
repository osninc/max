import axios from 'axios';
import { ACTORS, APIFY, SAMEASCOUNTY } from '../constants/constants';
import { processError } from '../error';
import { convertCountyStr, convertDateToLocal, sec2min, time2epoch } from '../functions/functions';
import { getPropertyParams } from '../zillowGraphQl';
import { defaultHeaders } from '../headers.js';
import { normalizeTheData } from './normalize';
import { buildApifyUrl } from './buildApifyUrl.js';
import { fixData } from './fixData.js';
import STATES from '../data/states.json';

// This is only for realtor inventory data.  Get the latest successful run
export const fetchInventory = async () => {
    try {
        const url = buildApifyUrl('realtor', 'inventory', 'lastdataset', '');
        const response = await axios.get(url);
        const data = response.data;
        return data;
    } catch (error) {
        // Special error here, if it returns 404, then there are no runs, but exit gracefully
        if (error.response && error.response.status === 404) return [];
        else throw { message: processError('apify:fetchInventory', error) };
    }
};
// Get specific data from inventory
export const findInventoryData = async (data, searchType, area) => {
    const removeCountyExt = (county) => {
        let returnCounty = county;
        const strReplace = [...SAMEASCOUNTY, ' City and'];
        strReplace.map((ext) => (returnCounty = returnCounty.replace(ext.toLowerCase(), '')));
        return returnCounty;
    };
    const transformSearchType = searchType.toLowerCase() === 'zipcode' ? 'zip' : searchType.toLowerCase();
    const entry = data.filter((e) => e.geoType && e.geoType.toLowerCase() === transformSearchType);
    const json = entry.length > 0 ? entry[0].jsonUrl : '';
    if (json !== '') {
        const api_call = await fetch(json);
        const jsonData = await api_call.json();
        let field = '';
        let compareValue = area.toLowerCase();
        switch (transformSearchType) {
            case 'county':
                field = 'county_name';
                compareValue = removeCountyExt(compareValue);
                break;
            case 'zip':
                // if there is a leading zero in the zipcode, then it becomes a number
                field = 'postal_code';
                compareValue = parseInt(compareValue).toString();
                break;
            case 'state':
                field = 'state_id';
                break;
            default:
                break;
        }
        const theData = jsonData.filter((entry) => entry[field].toLowerCase() === compareValue.toLowerCase());
        return theData.length > 0 ? theData[0] : null;
    } else return null;
};

export const fetchStore = async (storeId) => {
    try {
        //const url = `${APIFY.inputs.realTime.replace('<STOREID>', storeId)}?token=${APIFY.base.token}`;
        const url = buildApifyUrl('', '', 'input', storeId);
        const response = await axios.get(url);
        const data = response.data;
        // make this backwards compatible
        const search = data.searchBy ? data[data.searchBy] : data[data.searchType];
        return {
            searchBy: data.searchBy ? data.searchBy : data.searchType,
            search: search,
        };
    } catch (error) {
        throw { message: processError('apify:fetchStore', error) };
    }
};

export const fetchCountsData = async (id) => {
    try {
        //const url = `${APIFY.datasets.realTime.replace('<DATASETID>', id)}?token=${APIFY.base.token}`
        const url = buildApifyUrl('', '', 'datasets', id);
        const axiosObj = {
            method: 'GET',
            url,
        };

        const response = await axios(axiosObj);
        const data = response.data;

        const filteredData = data.filter((el) => el.timeStamp);
        const listingsCount = filteredData
            .filter((el) => el.mapCount !== 'N/A')
            .reduce((a, b) => a + (b.mapCount ?? 0), 0);
        const agentCount = filteredData
            .filter((el) => el.agentCount !== 'N/A')
            .reduce((a, b) => a + (b.agentCount ?? b.count), 0);
        return {
            counts: {
                listings: listingsCount,
                agent: agentCount,
            },
        };
    } catch (error) {
        throw { message: processError('apify:fetchListingsData', error) };
    }
};

const findAllDetailDatasets = async (source) => {
    // Check for at detail datasets
    const aryOfStoreIds = await getDetailsSuccessfulRuns(source);
    if (aryOfStoreIds.length === 0) return [];

    //const detailsSets = await findAllDetaillDatasetId()
    const aryOfResults = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        aryOfStoreIds.map(async ({ datasetId, storeId }) => {
            //const url = `${APIFY.listOfDetails.listOfInputs.replace('<STOREID>', storeId)}?token=${APIFY.base.token}&status=SUCCEEDED`;
            const url = buildApifyUrl(source, 'details', 'input', storeId);

            const response = await axios.get(url);
            const data = response.data;
            return data.datasetId;
        }),
    );
    return [...new Set(aryOfResults)];
};

const getCountsSuccessfulRuns = async (source) => {
    // Get a list of details datasets
    const detailsDatasets = await findAllDetailDatasets(source);

    // if (detailsDatasets.length === 0)
    //     return []

    //const url = `${APIFY.base.url}${APIFY.runs.endPoint}?token=${APIFY.base.token}&status=SUCCEEDED&desc=true`;
    const url = buildApifyUrl(source, 'count', 'runs');
    const response = await axios.get(url);
    const data = response.data;

    const aryOfItems = await Promise.all(
        data.data.items.map(async (item) => {
            const storeId = item.defaultKeyValueStoreId;
            let { searchBy, search } = await fetchStore(storeId);

            if (searchBy.toLowerCase() === 'state') {
                search = STATES[search.toUpperCase()];
            }

            // fetch actual data for counts in dropdown (this is redundant TODO:)
            const { counts } = await fetchCountsData(item.defaultDatasetId);
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
                text: (
                    <>
                        <i>{searchBy}</i>:<strong>{search}</strong> <i>{convertDateToLocal(item.startedAt)}</i>{' '}
                        <strong>{item.defaultDatasetId}</strong>
                    </>
                ),
            };
        }),
    );
    // Filter out ones where both listing and agent numbers are zero
    return ACTORS[source.toUpperCase()].COUNT.IGNORECOUNTFILTER
        ? aryOfItems
        : aryOfItems.filter((item) => item.counts.agent > 0 && item.counts.listings > 0);
};

export const fetchDatasets = async (source) => {
    try {
        return await getCountsSuccessfulRuns(source);
    } catch (error) {
        throw { message: processError('apify:fetchDatasets', error) };
    }
};

const findListingInObj = (obj, zpid) => {
    let foundElement = '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const d = Object.keys(obj)
        .filter((el) => el !== 'meta')
        .map((acreage) => {
            Object.keys(obj[acreage]).map((time) => {
                const ary = [...obj[acreage][time]['for sale'].listings, ...obj[acreage][time]['sold'].listings];

                if (foundElement === '') {
                    foundElement = ary.find((e) => e.zpid === zpid);
                }
            });
        });
    //console.log(fixElement(foundElement))
    return foundElement === '' ? {} : { data: { property: fixElement(foundElement) } };
};

const fixElement = (el) => {
    return {
        ...el,
        address: {
            city: el.city,
            state: el.state,
            streetAddress: el.streetAddress,
            zipcode: el.zipcode,
        },
        priceHistory: el.priceHistory,
        pageViewCount: el.views,
        favoriteCount: el.favorites,
        unformattedPrice: el.unformattedPrice,
    };
};

export const fetchDetailsData = async (source, counts, zpid) => {
    // Check if counts already has the details, if so, return that data
    if (counts.meta.hasDetails) {
        const returnObj = findListingInObj(counts, zpid);
        if (Object.keys(returnObj).length > 0) {
            return returnObj;
        }
    }

    const url = ACTORS[source.toUpperCase()].DETAILS.GRAPHQL;

    const graphQlParams = getPropertyParams(zpid);

    let baseConfig = {
        headers: {
            ...defaultHeaders,
            Referer: 'https://www.zillow.com/',
            'Referrer-Policy': 'unsafe-url',
        },
        responseType: 'json',
    };

    try {
        const response = await axios.post(url, graphQlParams, baseConfig);
        const data = response.data;

        return data;
    } catch (error) {
        try {
            // getting backup
            const url = APIFY.details.backup;

            // Prepare Actor input
            const input = {
                zpid,
                proxy: 'residential',
            };

            const response = await axios.post(url, input);
            const data = response.data;
            return data[0];
        } catch (error2) {
            throw { message: processError('apify:fetchDetailsData', error2) };
        }
    }
};

const getDetailsSuccessfulRuns = async (source) => {
    // Get a list of runs
    //const url = `${APIFY.listOfDetails.listOfRuns}?token=${APIFY.base.token}&status=SUCCEEDED`;
    const url = buildApifyUrl(source, 'details', 'runs');

    try {
        const response = await axios.get(url);
        const data = response.data;

        // Returns a list of storeId and datasetIds
        return data.data.items
            .filter((d) => !d.actorTaskId)
            .map((d) => {
                return {
                    datasetId: d.defaultDatasetId,
                    storeId: d.defaultKeyValueStoreId,
                };
            });
    } catch (error) {
        // If there is an error, just return an empty array
        return [];
    }
};

const findDetailsDatasetsByRunDatasetId = async (aryOfStoreIds, ds) => {
    const aryOfResults = await Promise.all(
        aryOfStoreIds.map(async ({ datasetId, storeId }) => {
            //const url = `${APIFY.listOfDetails.listOfInputs.replace('<STOREID>', storeId)}?token=${APIFY.base.token}&status=SUCCEEDED`;
            const url = buildApifyUrl('', '', 'input', storeId);
            const response = await axios.get(url);
            const data = response.data;
            if (data.datasetId === ds) return datasetId;
        }),
    );

    // filter out null and undefined elements
    const newAry = aryOfResults.filter((el) => el);

    // Return the latest one if there are results
    return newAry; //.length > 0 ? newAry[0] : ''
};

const findCountsDatasetIdByInput = (aryOfRuns, search) => {
    if (!aryOfRuns) return '';

    const obj = aryOfRuns.find((run) => run.search === search);

    return obj ? obj.value : '';
};

const findDetailsRunByDatasetId = async (source, ds) => {
    // Get a list of successful runs
    const listOfStoreIds = await getDetailsSuccessfulRuns(source);
    // find which store has the input of the current datasetId
    // Returns array
    if (listOfStoreIds.length === 0) return '';

    const runDatasetId = await findDetailsDatasetsByRunDatasetId(listOfStoreIds, ds);

    return runDatasetId.length > 0 ? runDatasetId[0] : '';
};

export const fetchDetails = async (source, ds, automaticDetails) => {
    const theDatasetId = await findDetailsRunByDatasetId(source, ds);

    // if array is zero length, then there isn't a match, launch the actor
    if (theDatasetId !== '') {
        //const url = `${APIFY.listOfDetails.datasetItems.replace('<DATASETID>', theDatasetId)}?token=${APIFY.base.token}`;
        const url = buildApifyUrl('', '', 'datasets', theDatasetId);
        const response = await axios.get(url);
        const data = response.data;
        return data;
    } else {
        if (automaticDetails) {
            const url4 = buildApifyUrl(source, 'details', 'runsync');
            const inputParams = {
                datasetId: ds,
                maxConcurrency: 500,
                proxyType: 'APIFY_RESIDENTIAL',
                scraper: 'AXIOS',
                sessionsKvsName: ds,
            };
            // POST runs the actor with the params
            const obj = {
                method: 'POST',
                data: inputParams,
                url: url4,
            };
            const response4 = await axios(obj);
            const data = response4.data;
            return data;
        }
    }
};

// This is the main search function
export const fetchData = async (source, params) => {
    const {
        ds,
        buildNumber,
        proxyType,
        scraper,
        forceCleanSessionsCreation,
        maxConcurrency,
        dataSavingStoreType,
        //automaticDetails,
        force,
    } = params;

    let search = params.search;

    let tempDs = ds;
    let searchBy = 'county';
    // figure out what kind of search it is
    if (search.length === 2) searchBy = 'state';
    if (search.length === 5) searchBy = 'zipCode';

    // fix the capitalization if new county search
    if (tempDs === '' && searchBy === 'county') {
        search = convertCountyStr(search);
    }

    // Prepare Actor input
    const input =
        buildNumber.includes('yir-dev-2') || buildNumber.includes('0.2.') // use old inputs
            ? {
                  searchBy,
                  [searchBy]: search,
                  proxyType: proxyType.toLowerCase(),
                  scraper: scraper.toLowerCase(),
                  debug: false,
              }
            : {
                  searchType: searchBy,
                  [searchBy]: search,
                  proxyType,
                  scraper,
                  debug: false,
                  forceCleanSessionsCreation,
                  maxConcurrency,
                  dataSavingStoreType,
              };

    let axiosObj;

    // Check to see if there is an existing Dataset for this search within the last X days
    if (tempDs === '' && !force) {
        const existingDs = await findExistingDataset(source, search);
        if (existingDs !== '') tempDs = existingDs;
    }

    if (tempDs === '') {
        //const url = `${APIFY.base.url}${APIFY.counts.endPoint}?token=${APIFY.base.token}&build=${buildNumber}`;
        const url = buildApifyUrl(source, 'count', 'new', '', buildNumber);
        axiosObj = {
            data: input,
            method: 'post',
            url,
        };
    } else {
        //const url = `${APIFY.datasets.realTime.replace('<DATASETID>', tempDs)}?token=${APIFY.base.token}`
        const url = buildApifyUrl('', '', 'datasets', tempDs);

        axiosObj = {
            method: 'get',
            url,
        };
    }

    try {
        const response = await axios(axiosObj);
        const data = response.data;

        // There might be extra array elements that are for debugging on apify
        const filteredData = data.filter((el) => el.scraper);

        // console.log({ filteredData })
        // Get the name of area
        // Pre-fill all variables
        const firstTrueRecord = filteredData[1];
        // console.log({data1})
        searchBy = firstTrueRecord['searchType'];
        let newSearch = firstTrueRecord[searchBy];
        // if (firstTrueRecord['state'] !== '') {
        //     newSearch = STATES[firstTrueRecord['state'].toUpperCase()];
        //     searchBy = 'state';
        // }
        // if (firstTrueRecord['county'] !== '') {
        //     newSearch = firstTrueRecord['county'];
        //     searchBy = 'county';
        // }
        // if (firstTrueRecord['zipCode'] !== '') {
        //     newSearch = firstTrueRecord['zipCode'];
        //     searchBy = 'zipCode';
        // }

        // See if this version has a datasetId in the return JSON
        // Check to see if there are any details already in the system for this dataset ID, if not, then launch a task

        // Merge listing details later
        let listingsDetails;
        // is there a datasetId in this dataset? if not, then get from param if any
        const thisDatasetId = filteredData[0]?.datasetId ?? tempDs;

        // if (thisDatasetId) {
        //     // fail gracefully if I can't get the details
        //     try {
        //         listingsDetails = await fetchDetails(source, thisDatasetId, automaticDetails);
        //     } catch (error) {
        //         console.log('Can not get details');
        //     }
        // }

        const fixedData = fixData(source, filteredData);

        const normalizedData = normalizeTheData(source, fixedData, listingsDetails);

        // console.log({
        //     data: normalizedData,
        //     area: newSearch,
        //     date: filteredData[1]?.timeStamp,
        //     searchBy
        // })

        return {
            data: normalizedData,
            area: newSearch,
            date: filteredData[1]?.timeStamp,
            datasetId: thisDatasetId,
            searchBy,
        };
    } catch (error) {
        throw { message: processError('apify:fetchData', error) };
    }
};

const findExistingDataset = async (source, search) => {
    // Get list of successful runs
    const listOfRuns = await getCountsSuccessfulRuns(source);
    // Filter the runs by last X days
    const someDaysAgo = new Date(Date.now() - APIFY.PASTDAYS * 24 * 60 * 60 * 1000);
    const runFromSomeDaysAgo = listOfRuns.filter((run) => {
        return run.epochTime >= someDaysAgo;
    });

    // Find what input it was
    const existingDs = await findCountsDatasetIdByInput(runFromSomeDaysAgo, search);
    // Return datasetId of the successful run where input is the same as 'search'
    return existingDs;
};
