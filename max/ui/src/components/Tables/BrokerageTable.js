/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import { defaultTheme } from '../../constants/theme';
import { ComingSoon } from './components/ComingSoon';
import { buildApifyUrl } from '../../api/buildApifyUrl';
import axios from 'axios';
import { processError } from '../../error';
import {
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';
import { useState } from 'react';
import { CircularProgressTimer } from '../Listings/CircularProgressTimer';
import { getRandomInt, later } from '../../functions/functions';

import detailsActor from '../../data/detailsActor.json';
import { fixDetails } from '../../api/fixDetails';

const consolidateBrokers = (data) => {
    let brokers = [];
    const d = Object.keys(data)
        .filter((el) => el !== 'meta')
        .map((acreage) => {
            Object.keys(data[acreage]).map((time) => {
                //console.log(data[acreage][time])
                brokers = [
                    ...brokers,
                    ...data[acreage][time]['for sale'].listings.map((listing) => listing.broker).filter((el) => el),
                    ...data[acreage][time]['sold'].listings.map((listing) => listing.broker).filter((el) => el),
                ];
            });
        });

    // console.log({d})

    // Clean up TODO: make more efficient
    const b = brokers
        .filter((value, index, array) => {
            return array.findIndex((x) => x.name === value.name && x.number === value.number) === index;
        })
        .filter((el) => el.name !== null || el.number !== null)
        .map((obj, i) => ({ ...obj, id: i }));

    return b;
};

const fetchDetails = async (source, ds) => {
    try {
        //const url4 = `${APIFY.listOfDetails.listOfRuns}?token=${APIFY.base.token}&build=0.1.15`
        const url4 = buildApifyUrl(source, 'details', 'runs');
        const inputParams = {
            datasetId: ds,
        };
        // POST runs the actor with the params
        const response4 = await axios.post(url4, inputParams);
        console.log({ response4 });
        // don't have to wait
    } catch (error) {
        throw { message: processError('BrokerageTable:fetchDetails', error) };
    }
};

const ComingSoonRealtors = (props) => {
    const [loading, setLoading] = useState(false);
    const [loadTime, setLoadTime] = useState(0);

    const { area, header, date, datasetId, source, onDone } = props;

    const handleLaunchActor = async (e) => {
        setLoading(true);
        //const listingsDetails = await fetchDetails(source, thisDatasetId, automaticDetails)
        const details = detailsActor;
        const fixedDetails = fixDetails(details);
        // Construct in form if it were in the big normalized data
        const newData = {
            meta: {
                hasDetails: true,
            },
            acreage: {
                time: {
                    'for sale': {
                        listings: [],
                    },
                    sold: {
                        listings: details,
                    },
                },
            },
        };
        console.log({ newData });
        const rInt = getRandomInt(10);
        console.log(rInt);
        const d = await later(rInt * 1000, 'hi');
        setLoading(false);
        if (onDone) onDone(newData);
    };
    return loading ? (
        <CircularProgressTimer
            onUpdate={(sec) => {
                setLoadTime(sec);
            }}
        />
    ) : (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="simple table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#dddddd' }}>
                        <TableCell align="center">
                            <strong>Market Name: {area}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: header.color }}>
                        <TableCell align="center" sx={{ color: header.textColor }}>
                            <strong>{header.text}</strong>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell align="center">
                            <Button
                                variant="outlined"
                                startIcon={<FontAwesomeIcon icon={icon({ name: 'bolt' })} fixedWidth />}
                                onClick={handleLaunchActor}
                            >
                                Get info (this could take a while...)
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

ComingSoonRealtors.propTypes = {
    header: PropTypes.object,
    datasetId: PropTypes.string,
    area: PropTypes.string,
    date: PropTypes.string,
    source: PropTypes.string,
    onDone: PropTypes.func,
};

const BrokerageData = ({ data }) => {
    //console.log({ data });
    const columns = [
        { field: 'name', headerName: 'Brokerage Name', flex: 1 },
        { field: 'number', headerName: 'Phone', flex: 1 },
        { field: 'id4', headerName: 'Website', flex: 1 },
        { field: 'id2', headerName: 'Listings', flex: 1 },
        { field: 'id3', headerName: 'Sales', flex: 1 },
    ];
    const brokers = consolidateBrokers(data);
    //console.log({brokers})
    return (
        <DataGrid
            rows={brokers}
            columns={columns}
            initialState={{
                pagination: {
                    paginationModel: {
                        pageSize: 15,
                    },
                },
            }}
            pageSizeOptions={[5, 10, 15, 20]}
            disableRowSelectionOnClick
            density="compact"
            sx={{
                '& .MuiDataGrid-row:hover': {
                    backgroundColor: defaultTheme.palette.primary.light,
                    // color: "red"
                },
            }}
        />
    );
};

BrokerageData.propTypes = {
    data: PropTypes.object,
};

export const BrokerageTable = ({ data, datasetId, area, date, source }) => {
    const [brokerData, setBrokerData] = useState(data);

    if (source === 'zillow') {
        // console.log({ brokerData })
        if (brokerData.meta.hasDetails) {
            // console.log("I have data now")
            return <BrokerageData data={brokerData} />;
        } else
            return (
                // <ComingSoonRealtors
                //     area={area}
                //     datasetId={datasetId}
                //     header={{
                //         text: "Realtors",
                //         color: "#626262",
                //         textColor: "white"
                //     }}
                //     date={date}
                //     onDone={(theNewData) => {
                //         setBrokerData(theNewData)
                //     }}
                // />
                <ComingSoon
                    area={area}
                    header={{
                        text: 'Realtors',
                        color: '#626262',
                        textColor: 'white',
                    }}
                    date={date}
                />
            );
    } else {
        return (
            <ComingSoon
                area={area}
                header={{
                    text: 'Realtors',
                    color: '#626262',
                    textColor: 'white',
                }}
                date={date}
            />
        );
    }
};

BrokerageTable.propTypes = {
    data: PropTypes.object,
    datasetId: PropTypes.string,
    area: PropTypes.string,
    date: PropTypes.string,
    source: PropTypes.string,
};
