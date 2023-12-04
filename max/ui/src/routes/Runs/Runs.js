import { DataGrid } from '@mui/x-data-grid';
import { processError } from '../../error';
import axios from 'axios';
import { DisplayNumber, convertDateToLocal, sec2min, time2epoch } from '../../functions/functions';
import { useState } from 'react';
import { Button, CircularProgress, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';

import { defaultTheme } from '../../constants/theme.js';
import { buildApifyUrl } from '../../api/buildApifyUrl';

//const LIMIT = 1000;

const Runs = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [message, setMessage] = useState('');
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStore = async (storeId) => {
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
            setMessage(processError('fetchStore', error));
            return {
                searchBy: '',
                search: '',
            };
        }
    };

    const findUniqueListings = (listings) => {
        const allZpid = listings.map((item) => item.listings.map((property) => property.zpid)).flat(1);
        const uniqueZpid = allZpid.filter((value, index, array) => array.indexOf(value) === index);

        const allFsZpid = listings
            .map((item) => item.listings.filter((i) => i.statusType === 'FOR_SALE').map((property) => property.zpid))
            .flat(1);
        const allSoldZpid = listings
            .map((item) => item.listings.filter((i) => i.statusType === 'SOLD').map((property) => property.zpid))
            .flat(1);
        const uniqueFsZpid = allFsZpid.filter((value, index, array) => array.indexOf(value) === index);
        const uniqueSoldZpid = allSoldZpid.filter((value, index, array) => array.indexOf(value) === index);

        return {
            all: uniqueZpid.length,
            sold: uniqueSoldZpid.length,
            forSale: uniqueFsZpid.length,
        };
    };

    const fetchCountsData = async (id) => {
        try {
            //const url = `${APIFY.datasets.realTime.replace('<DATASETID>', id)}?token=${APIFY.base.token}`;
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
                .reduce((a, b) => a + b.mapCount, 0);
            const agentCount = filteredData
                .filter((el) => el.agentCount !== 'N/A')
                .reduce((a, b) => a + b.agentCount, 0);
            const agentListingRatio =
                agentCount === 0 ? 0 : DisplayNumber.format(((listingsCount / agentCount) * 100).toFixed(2));
            const unique = findUniqueListings(filteredData);
            const uniqueRatio = listingsCount === 0 ? 0 : ((unique.all / listingsCount) * 100).toFixed(2);
            return {
                counts: {
                    listings: listingsCount,
                    agent: agentCount,
                    unique,
                    agentListingRatio,
                    uniqueRatio,
                    uniqueSold: unique.sold,
                    uniqueForSale: unique.forSale,
                },
            };
        } catch (error) {
            setMessage(processError('fetchListingsData', error));
            return {
                counts: {
                    listings: 'N/A',
                    agent: 'N/A',
                    unique: 'N/A',
                    agentListingRatio: 'N/A',
                    uniqueRatio: 'N/A',
                    uniqueSold: 'N/A',
                    uniqueForSale: 'N/A',
                },
            };
        }
    };

    const fetchDatasets = async () => {
        try {
            //const url = `${APIFY.base.url}${APIFY.runs.endPoint}?token=${APIFY.base.token}&status=SUCCEEDED&desc=true&limit=${LIMIT}`;
            const url = buildApifyUrl('zillow', 'count', 'runs');
            const response = await axios.get(url);
            const data = response.data;

            const aryOfItems = await Promise.all(
                data.data.items.map(async (item) => {
                    const storeId = item.defaultKeyValueStoreId;
                    const { searchBy, search } = await fetchStore(storeId);
                    // fetch actual data for counts in dropdown (this is redundant TODO:)
                    const { counts } = await fetchCountsData(item.defaultDatasetId);
                    return {
                        value: item.defaultDatasetId,
                        searchBy: searchBy,
                        search: search,
                        date: convertDateToLocal(item.startedAt),
                        elapsedTime: sec2min(
                            ((time2epoch(item.finishedAt) - time2epoch(item.startedAt)) / 1000).toFixed(0),
                        ),
                        counts,
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

            setDatasets(aryOfItems);
        } catch (error) {
            setMessage(processError('fecthDatasets', error));
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async () => {
        setLoading(true);
        await fetchDatasets();
    };

    const columns = [
        {
            field: 'date',
            headerName: 'Date/Time',
            flex: 1.5,
        },
        {
            field: 'searchBy',
            headerName: 'Type',
            flex: 1,
        },
        {
            field: 'search',
            headerName: 'Location',
            flex: 1,
        },
        {
            field: 'elapsedTime',
            headerName: 'Duration',
            flex: 1,
        },

        {
            field: 'counts',
            flex: 1,
            headerName: 'Count',
            valueGetter: (params) => DisplayNumber.format(params.row.counts.agent),
        },
        {
            field: 'mapCounts',
            flex: 1,
            headerName: 'Details',
            valueGetter: (params) => DisplayNumber.format(params.row.counts.listings),
        },
        {
            field: 'countsRatio',
            flex: 1,
            headerName: '% Details/Counts',
            valueGetter: (params) => `${params.row.counts.agentListingRatio}%`,
        },
        {
            field: 'unique',
            flex: 1,
            headerName: 'Unique ZPID',
            valueGetter: (params) => DisplayNumber.format(params.row.counts.unique.all),
        },
        {
            field: 'uniqueRatio',
            flex: 1,
            headerName: '% Unique/Details',
            valueGetter: (params) => `${params.row.counts.uniqueRatio}%`,
        },
        {
            field: 'uniqueForSale',
            flex: 1,
            headerName: 'Unique For Sale',
            valueGetter: (params) => DisplayNumber.format(params.row.counts.uniqueForSale),
        },
        {
            field: 'uniqueSold',
            flex: 1,
            headerName: 'Unique Sold',
            valueGetter: (params) => DisplayNumber.format(params.row.counts.uniqueSold),
        },
        { field: 'value', flex: 1, headerName: 'DatasetID' },
        { field: 'build', flex: 1, headerName: 'Build' },
    ];

    return (
        <ThemeProvider theme={defaultTheme}>
            <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: 'none' } }} />
            <CssBaseline />
            {loading
                ? [<CircularProgress key={0} />, `This might take a while.`]
                : [
                      <Button key={0} onClick={handleClick} variant="contained">
                          Generate Table
                      </Button>,
                      datasets.length > 0 && (
                          <DataGrid
                              key={1}
                              getRowId={(row) => row.value}
                              rows={datasets}
                              columns={columns}
                              initialState={{
                                  pagination: {
                                      paginationModel: {
                                          pageSize: 15,
                                      },
                                  },
                              }}
                              pageSizeOptions={[5, 10, 15, 20, 25, 50, 100]}
                              disableRowSelectionOnClick
                              density="compact"
                              sx={{
                                  '& .MuiDataGrid-row:hover': {
                                      backgroundColor: defaultTheme.palette.primary.light,
                                      // color: "red"
                                  },
                              }}
                          />
                      ),
                  ]}
        </ThemeProvider>
    );
};

export default Runs;
