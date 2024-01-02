/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';

import TabPanel from '../../components/TabPanel.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';

import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import {
    Alert,
    Box,
    Checkbox,
    CircularProgress,
    Divider,
    Drawer,
    FormControl,
    FormControlLabel,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Modal,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Snackbar,
    Tab,
    Tabs,
} from '@mui/material';
import { processError } from '../../error.js';

import { DetailsView } from '../../components/DetailsView.js';
import { DisplayNumber, capitalizeFirstLetter } from '../../functions/functions.js';
import { calcAvg, sqft2acre } from '../../functions/formulas';

import { ACTORS, iconButtonFAStyle, modalStyle } from '../../constants/constants.js';
import { Copyright } from '../../components/Copyright.js';
import { BigDataTable } from '../../components/Tables/BigDataTable.js';
import { matrix } from '../../constants/matrix.js';
import SelectLocation from '../../components/SelectLocation.js';
import ListingsView from '../../components/ListingsView.js';
import { CircularProgressTimer } from '../../components/Listings/CircularProgressTimer.js';

import { BrokerageTable } from '../../components/Tables/BrokerageTable.js';
import { fetchData, fetchDatasets, fetchDetailsData, fetchDetails } from '../../api/apify.js';
import { InventoryData } from '../../components/InventoryData.js';
import { Netronline } from '../../components/Netronline.js';
import { fixDetails } from '../../api/fixDetails.js';
import { fixListings } from '../../api/normalize.js';

const sources = Object.keys(ACTORS).map((actor) => actor.toLowerCase());

import useIsMounted from '../../hooks/useIsMounted.js';

const Main = ({ debugOptions }) => {
    const [isLoading, setLoading] = useState(false);
    const [isListingLoading, setListingLoading] = useState(false);
    const [isDetailsLoading, setDetailsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [counts, setCounts] = useState({});
    const [search, setSearch] = useState('');
    const [openDrawer, setOpenDrawer] = useState(false);
    const [listings, setListings] = useState([]);
    const [searchBy, setSearchBy] = useState('county');
    const [drawerTitle, setDrawerTitle] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [details, setDetails] = useState({});
    const [area, setArea] = useState('');
    const [countsDate, setCountsDate] = useState('');
    const [openSnack, setOpenSnack] = useState(false);
    const [forceData, setForceData] = useState(false);

    const searchParams = new URLSearchParams(document.location.search);

    const [datasetId, setDatasetId] = useState('');

    const [loadTime, setLoadTime] = useState(0);

    const hasDebugMenu = searchParams.has('debugMenu');

    const [source, setSource] = useState(sources[0]);

    const defaultBigDataObj = {
        area: '',
        date: '',
        data: {},
        searchBy: '',
        datasets: [],
    };

    const [bigData, setBigData] = useState({});

    const reInitSource = (source) => {
        if (bigData[source]) {
            setArea(bigData[source].area ?? '');
            setCountsDate(bigData[source].date ?? '');
            setCounts(bigData[source].data ?? {});
            setSearchBy(bigData[source].searchBy ?? '');
            setSearch(bigData[source].area ?? '');
            setDatasets(bigData[source].datasets ?? []);
        } else {
            setBigData((prev) => {
                return {
                    ...prev,
                    [source]: defaultBigDataObj,
                };
            });
            setArea(defaultBigDataObj.area);
            setCountsDate(defaultBigDataObj.date);
            setCounts(defaultBigDataObj.data);
            setSearchBy(defaultBigDataObj.searchBy);
            setSearch(defaultBigDataObj.area);
            setDatasets(defaultBigDataObj.datasets);
        }
    };
    const handleSourceTabChange = (event, newValue) => {
        setSource(newValue);
        reInitSource(newValue);
        setPrevDsSource(newValue);
    };

    const [childRef, setChildRef] = useState();
    const toggleDrawer = (event, p, ref) => {
        setOpenDrawer((openDrawer) => {
            // if it wasn't open before, then set the loader and load data

            // If the drawer is opening, highlight the ref yellow, otherwise clear it
            if (ref && ref.current) {
                // if currently close, then it will open
                if (!openDrawer) {
                    setChildRef(ref);
                    const me = ref.current;
                    me.style.backgroundColor = 'yellow';
                }
            } else {
                childRef.current.style.backgroundColor = '';
                setChildRef(null);
            }

            if (!openDrawer) {
                if (p) {
                    let sizeStr = '';
                    if (p.minLotSize)
                        sizeStr = p.maxLotSize
                            ? `${sqft2acre(p.minLotSize)}-${sqft2acre(p.maxLotSize)}`
                            : `${sqft2acre(p.minLotSize)}+`;
                    if (p.maxLotSize && !p.minLotSize) sizeStr = `0-${sqft2acre(p.maxLotSize)}`;

                    const saleText = p.status === 'sale' ? 'for sale' : 'sold';
                    const timeText = Object.keys(matrix[source].time).find(
                        (key) => matrix[source].time[key] === p.time,
                    );
                    let detailsText = '';
                    if (ACTORS[source.toUpperCase()].SHOWDISCLAIMER)
                        detailsText = ` Details = ${DisplayNumber.format(p.mapCount)}`;
                    const title = `(Count=${DisplayNumber.format(
                        p.count,
                    )}${detailsText}) ${sizeStr} acre lots in ${area} ${saleText} within last ${timeText}`;
                    setDrawerTitle(title);
                    fetchListingData({
                        ...p,
                        [searchBy]: search,
                        proxyType: debugOptions.proxyType,
                        status: saleText,
                        time: timeText,
                    });
                }
            }
            return !openDrawer;
        });
    };

    // TODO: fetchListingData from local
    const fetchListingData = async (params) => {
        const { lot, time, status } = params;
        setMessage('');
        setListingLoading(true);

        try {
            const data = counts[lot][time][status].listings;
            setListings(data);
        } catch (error) {
            setMessage(processError('main:fetchListingData', error));
            setOpenSnack(true);
        } finally {
            setListingLoading(false);
        }
    };

    const clearStates = () => {
        // setArea("")
        // setCountsDate("")
        // setCounts({})
        // setSearchBy("")
        // setSearch("")
    };

    const loadData = async (source, ds, force) => {
        // input: { search, ds, buildNumber, proxy, scraper }
        // output: { data, area, date, searchBy }
        const params = {
            search,
            ds,
            ...debugOptions,
            force,
        };

        try {
            const { data, area, date, searchBy, datasetId } = await fetchData(source, params);
            setDataset(datasetId);
            //console.log({ data, area, date, searchBy });
            //const rInt = getRandomInt(10)
            //console.log(rInt)
            //const { data, area, date, searchBy } = await later(rInt * 1000, { data: {meta: {hasDetails: false}, "0-1": {"for sale": {listings: []}}}, area: `hello from ${rInt}`, date: "the date", searchBy: "county" })
            setBigData((prev) => {
                return {
                    ...prev,
                    [source]: {
                        ...prev[source],
                        data,
                        area,
                        date,
                        searchBy,
                    },
                };
            });

            setSourceLoading((prev) => {
                return {
                    ...prev,
                    [source]: false,
                };
            });
        } catch (error) {
            setMessage(processError(`main:loadData:${source}`, error));
            setOpenSnack(true);
        }
    };

    // This function is handling the main search button
    const handleClick = async () => {
        setSourceLoading(sourcesSelected);
        Object.keys(sourcesSelected).map((source) => {
            if (sourcesSelected[source]) loadData(source, '', forceData);
        });
    };

    const handleTextChange = (e) => {
        setSearch(e);
    };

    const openDetails = async (zpid) => {
        handleOpenModal();
        try {
            setMessage('');
            setDetailsLoading(true);
            const details = await fetchDetailsData(source, counts, zpid);
            setDetails(details);
        } catch (error) {
            setMessage(processError('main:fetchDetailsData', error));
            setDetails({});
            setOpenSnack(true);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    // Tabs
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const a11yProps = (index) => {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    };

    if (searchParams.has('datasetid')) {
        if (datasetId === '') {
            setDatasetId(searchParams.get('datasetid'));
        }
    }

    const [dataset, setDataset] = useState('');

    const handleDatasetChange = (event) => {
        setDataset(event.target.value);
    };

    const [sourceLoading, setSourceLoading] = useState(sources.reduce((a, v) => ({ ...a, [v]: false }), {}));

    const handleDatasetSearch = async () => {
        setSourceLoading((prev) => {
            return {
                ...prev,
                [prevDsSource]: true,
            };
        });
        // Searching old data, don't pass the force flag
        await loadData(prevDsSource, dataset, false);
    };

    const [initialLoad, setInitialLoad] = useState(false);
    useEffect(() => {
        if (Object.keys(bigData).length > 0) {
            // This is the first time to have data
            if (!initialLoad) {
                // set my first data
                const newSource = Object.keys(bigData)[0];
                setSource(newSource);
                reInitSource(newSource);
                // Only set it to true if I truly have data, not a set of datasets
                if (bigData[newSource].data && Object.keys(bigData[newSource].data).length > 0) setInitialLoad(true);
            } else {
                setSource(source);
                reInitSource(source);
            }
        } else {
            // Every other time
            if (initialLoad) {
                setSource(source);
                reInitSource(source);
            }
        }
    }, [bigData, source]);

    useEffect(() => {
        const f = async () => {
            if (debugOptions.automaticDetails) {
                await launchGetDetails(source);
            }
        };

        if (Object.keys(counts).length > 0) f();
    }, [counts]);

    const [datasetLoading, setDatasetLoading] = useState(false);
    const [datasets, setDatasets] = useState([]);

    const handleDatasetClick = async (event) => {
        if (datasets.length === 0) {
            // update dropdown
            try {
                setDatasetLoading(true);
                const datasets = await fetchDatasets(prevDsSource);
                //console.log({datasets})
                setDatasets(datasets);
                setBigData((prev) => {
                    return {
                        ...prev,
                        [prevDsSource]: {
                            ...prev[prevDsSource],
                            datasets,
                        },
                    };
                });
            } catch (error) {
                setMessage(processError('main:fetchDatasets', error));
                setOpenSnack(true);
                setDatasets([]);
            } finally {
                setDatasetLoading(false);
            }
        }
    };

    const gridWidth = hasDebugMenu ? 6 : 12;

    const [sourcesSelected, setSourcesSelected] = React.useState(
        sources.reduce((a, v) => ({ ...a, [v]: ACTORS[v.toUpperCase()].ACTIVE }), {}),
    );
    const handleSourcesSelected = (event) => {
        setSourcesSelected((prev) => {
            // Make sure at least one is checked
            const original = {
                ...prev,
            };
            const updated = {
                ...prev,
                [event.target.name]: event.target.checked,
            };
            return Object.values(updated).filter((p) => p === true).length === 0 ? original : updated;
        });
    };

    const handleForceData = (event) => {
        setForceData(event.target.checked);
    };

    const [searchType, setSearchType] = useState('new');

    const handleSearchTypeChange = (event, newValue) => {
        setSearchType(newValue);
    };

    const [prevDsSource, setPrevDsSource] = React.useState(sources[0]);

    const handlePrevDsSourceChange = (event) => {
        setSource(event.target.value);
        reInitSource(event.target.value);
        setPrevDsSource(event.target.value);
    };

    // This function will modify the original data
    const mergeDetailsWithCounts = (data, details) => {
        const d = data.data;
        const keys = ['for sale', 'sold'];
        Object.keys(d)
            .filter((el) => el !== 'meta')
            .map((acreage) => {
                Object.keys(d[acreage]).map((timeDim) => {
                    keys.map((status) => {
                        const oldListings = d[acreage][timeDim][status].listings;
                        const newListings = fixListings(oldListings, details);
                        const listingsWithValues = {
                            dom: newListings
                                .filter((l) => l.dom !== 'N/A')
                                .map((listing) => listing.dom)
                                .filter((el) => el),
                        };
                        d[acreage][timeDim][status].listings = newListings;
                        // Calculate DOM
                        d[acreage][timeDim][status].avgDom = calcAvg(listingsWithValues.dom);
                        d[acreage][timeDim][status].domCount = listingsWithValues.dom.length;
                    });
                });
            });
        d.meta.hasDetails = true;
        d.meta.checkForDetails = false;
    };

    const [loadingDetails, setLoadingDetails] = useState(false);

    const launchGetDetails = async (source) => {
        try {
            setLoadingDetails(true);
            const listingsDetails = await fetchDetails(source, dataset, true);
            if (listingsDetails) {
                const fixedDetails = fixDetails(listingsDetails);
                // This will modify the original data
                mergeDetailsWithCounts(bigData[source], fixedDetails);
                reInitSource(source);
                //setTabValue(tabValue);
            }
        } catch (error) {
            setMessage(processError('main:launchGetDetails', error));
            setOpenSnack(true);
        } finally {
            setLoadingDetails(false);
        }
    };

    // This is specifically for loading the map
    const [currentMapState, setCurrentMapState] = useState('');
    const [currentMapCounty, setCurrentMapCounty] = useState('');
    const updateSearch = (county) => {
        const searchStr = `${county} County, ${currentMapState}`;
        setSearch(searchStr);
    };
    const updateSearchState = (state) => {
        // clear the county
        setCurrentMapCounty('');
        setCurrentMapState(state);
        setSearch(state);
    };
    // This gets the county id
    simplemaps_countymap.hooks.zoomable_click_state = (id) => {
        const countyName = simplemaps_countymap_mapdata.state_specific[id].name;
        setCurrentMapCounty(countyName);
        updateSearch(countyName);
    };

    useEffect(() => {
        simplemaps_countymap.load();
        // do whatever you need to do when the component mounts
        // This gets the US State user clicked on
        simplemaps_countymap.hooks.zoomable_click_region = (id) => {
            updateSearchState(id);
        };
        // This gets the US State user clicked on
        simplemaps_countymap.hooks.click_region = (id) => {
            updateSearchState(id);
        };
    }, []);

    return (
        <>
            <Container fixed maxWidth={false}>
                <Grid container spacing={0} alignItems="left">
                    <Grid item xs={gridWidth}>
                        {currentMapCounty}
                        {currentMapState}
                        <Tabs value={searchType} onChange={handleSearchTypeChange}>
                            <Tab
                                icon={<FontAwesomeIcon icon={icon({ name: 'magnifying-glass-plus' })} />}
                                label="New Search"
                                value="new"
                            />
                            <Tab
                                icon={<FontAwesomeIcon icon={icon({ name: 'repeat' })} />}
                                label="Previous Searches"
                                value="previous"
                            />
                            {/* <Tab
                                icon={<FontAwesomeIcon icon={icon({ name: 'map' })} />}
                                label="Search by Map"
                                value="map"
                            /> */}
                        </Tabs>

                        <div id="map"></div>

                        <TabPanel value={searchType} index="new">
                            <Paper
                                component="form"
                                elevation={0}
                                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
                            >
                                {/* <IconButton sx={{ p: '10px' }} aria-label="menu">
                <FontAwesomeIcon icon={icon({ name: 'map-pin' })} />
              </IconButton> */}
                                <SelectLocation onChange={(value) => handleTextChange(value)} value={search} />

                                {/* <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" /> */}

                                <LoadingButton
                                    sx={{ paddingLeft: 1, paddingRight: 1 }}
                                    loading={isLoading || datasetLoading}
                                    loadingIndicator="Fetching..."
                                    variant="contained"
                                    onClick={handleClick}
                                >
                                    <FontAwesomeIcon
                                        icon={icon({ name: 'search' })}
                                        fixedWidth
                                        style={iconButtonFAStyle}
                                    />
                                    Search
                                </LoadingButton>
                            </Paper>
                            <FormControlLabel
                                control={<Checkbox checked={forceData} onChange={handleForceData} size="small" />}
                                label="Force updated data"
                            />
                            <br />
                            {sources.map((source) => (
                                <FormControlLabel
                                    key={source}
                                    control={
                                        <Checkbox
                                            checked={sourcesSelected[source] && ACTORS[source.toUpperCase()].ACTIVE}
                                            onChange={handleSourcesSelected}
                                            name={source}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <>
                                            <img src={`logos/${source}.png`} width={20} height={20} />
                                            {!ACTORS[source.toUpperCase()].ACTIVE && (
                                                <Typography variant="caption">&nbsp;(Coming soon!)</Typography>
                                            )}
                                        </>
                                    }
                                    disabled={!ACTORS[source.toUpperCase()].ACTIVE}
                                />
                            ))}
                        </TabPanel>

                        <TabPanel value={searchType} index="previous">
                            <Paper
                                component="form"
                                elevation={0}
                                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}
                            >
                                <FormControl sx={{ m: 1, minWidth: 120 }} size="small" variant="standard">
                                    <InputLabel id="demo-select-small-label">Dataset</InputLabel>
                                    <Select
                                        labelId="demo-select-small-label"
                                        id="demo-select-small"
                                        value={dataset}
                                        label="Dataset ID"
                                        onChange={handleDatasetChange}
                                        onOpen={handleDatasetClick}
                                    >
                                        {datasetLoading
                                            ? [
                                                  <CircularProgress key={0} size={20} />,
                                                  <Typography key={1} variant="caption">
                                                      Updating...
                                                  </Typography>,
                                              ]
                                            : datasets.length > 0 &&
                                              datasets
                                                  .filter((el) => el.counts.agent > 0)
                                                  .map((ds) => [
                                                      <Divider key={`${ds.value}0`}>
                                                          <Typography variant="caption">{ds.date}</Typography>
                                                      </Divider>,
                                                      <MenuItem key={`${ds.value}1`} value={ds.value}>
                                                          {/* <ListItemIcon>
                            <FontAwesomeIcon icon={icon({ name: 'database' })} />
                          </ListItemIcon> */}
                                                          <ListItemIcon>
                                                              {ds.highlight && (
                                                                  <FontAwesomeIcon
                                                                      icon={icon({ name: 'check' })}
                                                                      size="xs"
                                                                  />
                                                              )}
                                                          </ListItemIcon>
                                                          <ListItemText
                                                              primary={
                                                                  <Typography component="span" variant="body2">
                                                                      {ds.searchBy}: <strong>{ds.search}</strong>
                                                                  </Typography>
                                                              }
                                                              secondary={
                                                                  <React.Fragment>
                                                                      <Typography
                                                                          sx={{ display: 'inline' }}
                                                                          component="span"
                                                                          variant="body2"
                                                                          color="text.primary"
                                                                      >
                                                                          {ds.elapsedTime} - Count:{' '}
                                                                          <b>{DisplayNumber.format(ds.counts.agent)}</b>
                                                                          {ACTORS[source.toUpperCase()]
                                                                              .SHOWDISCLAIMER && (
                                                                              <>
                                                                                  {' '}
                                                                                  - Details:{' '}
                                                                                  <b>
                                                                                      {DisplayNumber.format(
                                                                                          ds.counts.listings,
                                                                                      )}
                                                                                  </b>
                                                                              </>
                                                                          )}
                                                                      </Typography>
                                                                      {/* <br />
                              <Typography variant="caption" >{ds.value} - {ds.build}</Typography> */}
                                                                  </React.Fragment>
                                                              }
                                                          />
                                                      </MenuItem>,
                                                  ])}
                                    </Select>
                                </FormControl>
                                <LoadingButton
                                    loading={isLoading || datasetLoading}
                                    loadingIndicator="Fetching..."
                                    variant="contained"
                                    onClick={handleDatasetSearch}
                                >
                                    <FontAwesomeIcon
                                        icon={icon({ name: 'download' })}
                                        fixedWidth
                                        style={iconButtonFAStyle}
                                    />
                                    Get Dataset
                                </LoadingButton>
                            </Paper>
                            <FormControl>
                                <RadioGroup
                                    row
                                    name="row-radio-buttons-group"
                                    value={prevDsSource}
                                    onChange={handlePrevDsSourceChange}
                                >
                                    {sources.map((source) => (
                                        <FormControlLabel
                                            key={source}
                                            control={<Radio size="small" />}
                                            label={
                                                <>
                                                    <img src={`logos/${source}.png`} width={20} height={20} />
                                                    {!ACTORS[source.toUpperCase()].ACTIVE && (
                                                        <Typography variant="caption">&nbsp;(Coming soon!)</Typography>
                                                    )}
                                                </>
                                            }
                                            disabled={!ACTORS[source.toUpperCase()].ACTIVE}
                                            value={source}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </TabPanel>
                    </Grid>
                    {hasDebugMenu && (
                        <Grid item xs={gridWidth}>
                            <Typography variant="caption">
                                build: <strong>{debugOptions.buildNumber}</strong>
                                <br />
                                scraper: <strong>{debugOptions.scraper}</strong>
                                <br />
                                proxy: <strong>{debugOptions.proxyType}</strong>
                                <br />
                                dataSavingStoreType: <strong>{debugOptions.dataSavingStoreType}</strong>
                                <br />
                                maxConcurrency: <strong>{debugOptions.maxConcurrency}</strong>
                                <br />
                                forceCleanSessionsCreation:{' '}
                                <strong>{debugOptions.forceCleanSessionsCreation.toString()}</strong>
                                <br />
                                useOutseta: <strong>{debugOptions.useOutseta.toString()}</strong>
                                <br />
                                automaticDetails: <strong>{debugOptions.automaticDetails.toString()}</strong>
                                <br />
                            </Typography>
                        </Grid>
                    )}

                    <Grid item>
                        {sourceLoading[source] && !initialLoad ? (
                            <CircularProgressTimer
                                onUpdate={(sec) => {
                                    setLoadTime(sec);
                                }}
                            />
                        ) : (
                            initialLoad && (
                                <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: '100%' }}>
                                    <Tabs
                                        value={source}
                                        onChange={handleSourceTabChange}
                                        aria-label="basic tabs example"
                                        orientation="vertical"
                                        variant="scrollable"
                                        sx={{ marginTop: 14 }}
                                    >
                                        {sources.map((source) => (
                                            <Tab
                                                key={source}
                                                label={capitalizeFirstLetter(source)}
                                                value={source}
                                                disabled={!ACTORS[source.toUpperCase()].ACTIVE}
                                                variant="v"
                                            />
                                        ))}
                                    </Tabs>
                                    <Box>
                                        <Tabs
                                            value={tabValue}
                                            onChange={handleTabChange}
                                            aria-label="basic tabs example"
                                        >
                                            <Tab label="Sales & Listings" {...a11yProps(0)} value={0} variant="h" />
                                            <Tab label="List/Sale Ratio" {...a11yProps(2)} value={2} variant="h" />
                                            <Tab label="Months of Supply" {...a11yProps(4)} value={4} variant="h" />
                                            <Tab label="Absorption Rate" {...a11yProps(4)} value={7} variant="h" />
                                            <Tab label="Median Prices" {...a11yProps(1)} value={1} variant="h" />
                                            <Tab label="Price Per Acre" {...a11yProps(3)} value={3} variant="h" />
                                            <Tab label="Days on Market" {...a11yProps(5)} value={5} variant="h" />
                                            <Tab label="Realtors" {...a11yProps(6)} value={6} variant="h" />
                                        </Tabs>
                                        {sourceLoading[source] && initialLoad ? (
                                            <CircularProgressTimer
                                                onUpdate={(sec) => {
                                                    setLoadTime(sec);
                                                }}
                                            />
                                        ) : (
                                            Object.keys(counts).length > 0 && (
                                                <>
                                                    {tabValue === 6 ? (
                                                        <BrokerageTable
                                                            onFinished={() => {
                                                                alert("I'm done");
                                                            }}
                                                            data={counts}
                                                            datasetId={dataset}
                                                            //datasetId="HFUlstfORmP9MW205"
                                                            area={area}
                                                            date={countsDate}
                                                            source={source}
                                                            detailsLoading={loadingDetails}
                                                            onGetDetailsClick={() => {
                                                                launchGetDetails(source);
                                                            }}
                                                        />
                                                    ) : (
                                                        <>
                                                            <BigDataTable
                                                                loadTime={loadTime}
                                                                area={area}
                                                                date={countsDate}
                                                                source={source}
                                                                value={tabValue}
                                                                data={counts}
                                                                onClick={(e, p, ref) => {
                                                                    toggleDrawer(e, p, ref);
                                                                }}
                                                                onGetDetailsClick={() => {
                                                                    launchGetDetails(source);
                                                                }}
                                                                detailsLoading={loadingDetails}
                                                            />
                                                            <Grid container direction="row" sx={{ mt: 5 }}>
                                                                <Grid item xs={6} justifyContent={'center'}>
                                                                    <Netronline searchType={searchBy} area={area} />
                                                                </Grid>
                                                                <Grid item xs={6} justifyContent="flex-end">
                                                                    <InventoryData searchType={searchBy} area={area} />
                                                                </Grid>
                                                            </Grid>
                                                        </>
                                                    )}
                                                </>
                                            )
                                        )}
                                    </Box>
                                </Box>
                            )
                        )}
                    </Grid>
                </Grid>
            </Container>
            <Drawer anchor="bottom" open={openDrawer} onClose={() => toggleDrawer(false)}>
                <Typography align="center" variant="h6" gutterBottom color="primary">
                    {drawerTitle}
                </Typography>
                <Container>
                    <Box>
                        {isListingLoading ? (
                            <CircularProgress />
                        ) : (
                            <ListingsView
                                source={source}
                                listings={listings}
                                onDetailsClick={(zpid) => openDetails(zpid)}
                            />
                        )}
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
                            <DetailsView listings={listings} details={details} onClose={handleCloseModal} />
                        )}
                    </Box>
                </Fade>
            </Modal>

            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={openSnack}
                onClose={() => setOpenSnack(false)}
            >
                <Alert severity="error">
                    An error has occured. Please try again later
                    <br />
                    Message: {message}
                </Alert>
            </Snackbar>
        </>
    );
};

Main.propTypes = {
    debugOptions: PropTypes.object,
};

export default Main;
