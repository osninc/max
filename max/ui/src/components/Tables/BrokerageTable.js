/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import { defaultTheme } from '../../constants/theme';
import { ComingSoon } from './components/ComingSoon';
import { buildApifyUrl } from '../../api/buildApifyUrl';
import axios from 'axios';
import { processError } from '../../error';
import {
    Backdrop,
    Box,
    Button,
    CircularProgress,
    Container,
    Drawer,
    Fade,
    Modal,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';
import { useState } from 'react';
import { CircularProgressTimer } from '../Listings/CircularProgressTimer';
import { getRandomInt, later } from '../../functions/functions';

import detailsActor from '../../data/detailsActor.json';
import { fixDetails } from '../../api/fixDetails';
import ListingsView from '../ListingsView';
import { DetailsView } from '../DetailsView';
import { fetchDetailsData } from '../../api/apify';
import { modalStyle } from '../../constants/constants';
import { DetailsViewForBroker } from '../DetailsViewForBroker';

const consolidateBrokers = (data) => {
    const statuses = ['for sale', 'sold'];
    let brokers2 = {};
    const d = Object.keys(data)
        .filter((el) => el !== 'meta')
        .map((acreage) => {
            Object.keys(data[acreage]).map((time) => {
                statuses.map((status) => {
                    data[acreage][time][status].listings.map((listing) => {
                        if (listing.broker?.name) {
                            brokers2[listing.broker.name] = {
                                ...brokers2[listing.broker.name],
                                number: listing.broker.number,
                                [status]: {
                                    ...(brokers2[listing.broker.name] && brokers2[listing.broker.name][status]),
                                    listings: [
                                        ...(brokers2[listing.broker.name] && brokers2[listing.broker.name][status]
                                            ? brokers2[listing.broker.name][status]?.listings
                                            : []),
                                        listing,
                                    ],
                                },
                            };
                        }
                    });
                });
            });
        });

    const bb = Object.keys(brokers2)
        .map((broker, i) => {
            statuses.map((status) => {
                if (brokers2[broker][status]) {
                    brokers2[broker][status].listings = brokers2[broker][status].listings
                        .filter((value, index, array) => {
                            return array.findIndex((x) => x.zpid === value.zpid) === index;
                        })
                        .filter((el) => el.name !== null || el.number !== null)
                        .map((obj, i) => ({ ...obj, id: i }));
                } else {
                    brokers2[broker][status] = { listings: [] };
                }
            });

            return {
                name: broker,
                number: brokers2[broker].number,
                'for sale': brokers2[broker]['for sale'],
                sold: brokers2[broker].sold,
                id: i,
            };
        })
        .sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        });
    return bb;
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
    // Drawer stuff
    const [openDrawer, setOpenDrawer] = useState(false);
    const [drawerTitle, setDrawerTitle] = useState('');
    const [listings, setListings] = useState([]);

    // Make the button consistant
    const BrokerListingButton = ({ row, colName }) => {
        const title = {
            'for sale': 'listed',
            sold: 'sold',
        };
        const col = row[colName];
        return (
            <Button
                variant="text"
                sx={{ p: 0 }}
                onClick={() => {
                    setDrawerTitle(`All lots ${title[colName]} by ${row.name}`);
                    setListings(col.listings);
                    setOpenDrawer(true);
                }}
                disabled={col.listings.length === 0}
            >
                {col.listings.length}
            </Button>
        );
    };

    BrokerListingButton.propTypes = {
        row: PropTypes.object,
        colName: PropTypes.string,
    };
    const columns = [
        { field: 'name', headerName: 'Brokerage Name', flex: 1 },
        { field: 'number', headerName: 'Phone', flex: 1 },
        //{ field: 'id4', headerName: 'Website', flex: 1 },
        {
            field: 'for sale',
            headerName: 'Listings',
            flex: 1,
            renderCell: ({ row }) => <BrokerListingButton row={row} colName={'for sale'} />,
        },
        {
            field: 'sold',
            headerName: 'Sales',
            flex: 1,
            renderCell: ({ row }) => <BrokerListingButton row={row} colName={'sold'} />,
        },
    ];
    const brokers = consolidateBrokers(data);

    // Open details from drawer
    const [openModal, setOpenModal] = useState(false);
    const [isDetailsLoading, setDetailsLoading] = useState(false);
    const [details, setDetails] = useState({});
    const openDetails = async (zpid) => {
        handleOpenModal();
        try {
            //setMessage('');
            setDetailsLoading(true);
            const details = listings.find((listing) => listing.zpid === zpid);
            setDetails(details);
        } catch (error) {
            //setMessage(processError('main:fetchDetailsData', error));
            setDetails({});
            //setOpenSnack(true);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    return (
        <>
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
            <Drawer anchor="bottom" open={openDrawer} onClose={() => setOpenDrawer(false)}>
                <Typography align="center" variant="h6" gutterBottom color="primary">
                    {drawerTitle}
                </Typography>
                <Container>
                    <Box>
                        <ListingsView
                            source="zillow"
                            listings={listings}
                            onDetailsClick={(zpid) => openDetails(zpid)}
                            from="brokerage"
                        />
                    </Box>
                </Container>
            </Drawer>

            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={openModal}>
                    <Box sx={modalStyle}>
                        {isDetailsLoading ? (
                            <CircularProgress />
                        ) : (
                            <DetailsViewForBroker details={details} onClose={handleCloseModal} />
                        )}
                    </Box>
                </Fade>
            </Modal>
        </>
    );
};

BrokerageData.propTypes = {
    data: PropTypes.object,
};

export const BrokerageTable = ({ data, datasetId, area, date, source, detailsLoading, onGetDetailsClick }) => {
    const [brokerData, setBrokerData] = useState(data);

    if (source === 'zillow') {
        if (brokerData.meta.hasDetails) {
            return <BrokerageData data={brokerData} />;
        } else
            return (
                <ComingSoon
                    area={area}
                    header={{
                        text: 'Realtors',
                        color: '#626262',
                        textColor: 'white',
                    }}
                    date={date}
                    onGetDetailsClick={onGetDetailsClick}
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
                onGetDetailsClick={onGetDetailsClick}
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
    detailsLoading: PropTypes.bool,
    onGetDetailsClick: PropTypes.func,
};

BrokerageTable.defaultProps = {
    detailsLoading: false,
};
