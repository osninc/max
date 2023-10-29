import React, { useState } from "react";

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';

import TextField from '@mui/material/TextField';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import { Alert, Box, Checkbox, CircularProgress, Collapse, Divider, Drawer, FormControl, FormControlLabel, Input, InputLabel, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Modal, Paper, Select, Slider, Snackbar, Stack, Switch, Tab, Tabs } from "@mui/material";
import { processError } from "../../error.js";


import { DetailsView } from "../../components/DetailsView.js";
import { DisplayNumber } from "../../functions/functions.js"
import { sqft2acre } from "../../functions/formulas.js"

import { BUILD, DATASTORETYPE, PROXYTYPE, SCRAPER, iconButtonFAStyle, modalStyle } from "../../constants/constants.js";
import { Copyright } from "../../components/Copyright.js"
import { ZillowTable } from "../../components/ZillowTable.js";
import { timeMatrix } from "../../constants/matrix.js";
import SelectLocation from "../../components/SelectLocation.js";
import ListingsView from "../../components/ListingsView.js";
import { CircularProgressTimer } from "../../components/Listings/CircularProgressTimer.js";

import { BrokerageTable } from "../../components/BrokerageTable.js";
import { fetchData, fetchDatasets, fetchDetailsData } from "../../api/apify.js";
import { WhatsNew } from "../../components/WhatsNew.js";

const App = () => {
  const [isLoading, setLoading] = useState(false);
  const [isListingLoading, setListingLoading] = useState(false);
  const [isDetailsLoading, setDetailsLoading] = useState(false);
  const [message, setMessage] = useState("")
  const [counts, setCounts] = useState({})
  const [search, setSearch] = useState("")
  const [openDrawer, setOpenDrawer] = useState(false)
  const [listings, setListings] = useState([])
  const [searchBy, setSearchBy] = useState("county")
  const [drawerTitle, setDrawerTitle] = useState("")
  const [openModal, setOpenModal] = useState(false);
  const [details, setDetails] = useState({})
  const [area, setArea] = useState("")
  const [countsDate, setCountsDate] = useState("");
  const [openSnack, setOpenSnack] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const searchParams = new URLSearchParams(document.location.search);

  const hasDebugMenu = searchParams.has("debugMenu")
  const hasBuildOnQS = searchParams.has("build")

  const [datasetId, setDatasetId] = useState("")

  const [loadTime, setLoadTime] = useState(0)

  const [debugOptions, setDebugOptions] = useState({
    buildNumber: hasBuildOnQS ? searchParams.get("build") : BUILD,
    scraper: SCRAPER[0],
    proxyType: PROXYTYPE[0],
    maxConcurrency: 50,
    dataSavingStoreType: DATASTORETYPE[0],
    forceCleanSessionsCreation: false
  })

  const toggleDrawer = (event, p) => {
    setOpenDrawer(openDrawer => {
      // if it wasn't open before, then set the loader and load data
      if (!openDrawer) {
        if (p) {
          let sizeStr = ""
          if (p.minLotSize)
            sizeStr = p.maxLotSize ? `${sqft2acre(p.minLotSize)}-${sqft2acre(p.maxLotSize)}` : `${sqft2acre(p.minLotSize)}+`;
          if ((p.maxLotSize) && (!p.minLotSize))
            sizeStr = `0-${sqft2acre(p.maxLotSize)}`;

          const saleText = (p.status === "sale") ? "for sale" : "sold"
          const timeText = Object.keys(timeMatrix).find(key => timeMatrix[key] === p.time)
          setDrawerTitle(`(Count=${DisplayNumber.format(p.count)} Details=${DisplayNumber.format(p.mapCount)}) ${sizeStr} acre lots in ${area} ${saleText} within last ${timeText}`)
          fetchListingData(
            {
              ...p,
              [searchBy]: search,
              proxyType: debugOptions.proxyType,
              status: saleText,
              time: timeText
            }
          );
        }

      }
      return !openDrawer
    })
  }

  // TODO: fetchListingData from local
  const fetchListingData = async (params) => {
    const { lot, time, status } = params;
    setMessage("")
    setListingLoading(true);

    try {
      const data = counts[lot][time][status].listings
      setListings(data)
    } catch (error) {
      setMessage(processError("fetchListingData", error))
      setOpenSnack(true)
    } finally {
      setListingLoading(false);
    }
  }

  const clearStates = () => {
    // setArea("")
    // setCountsDate("")
    // setCounts({})
    // setSearchBy("")
    // setSearch("")
  }

  const loadData = async (ds) => {
    clearStates()
    try {
      setMessage("");
      setLoading(true);

      // input: { search, ds, buildNumber, proxy, scraper }
      // output: { data, area, date, searchBy }
      const params = {
        search,
        ds,
        ...debugOptions
      }

      const { data, area, date, searchBy } = await fetchData(params);

      setArea(area)
      setCountsDate(date)
      setCounts(data)
      setSearchBy(searchBy)
      setSearch(area)

    } catch (error) {
      setMessage(processError("fetchData", error))
      setOpenSnack(true)
    } finally {
      setLoading(false);
    }
  }

  const handleClick = async () => {
    setLoading(true);
    await loadData("");
  }

  const handleTextChange = e => {
    setSearch(e)
  }

  const openDetails = async (zpid) => {
    handleOpenModal()
    try {
      setMessage("")
      setDetailsLoading(true);
      const details = await fetchDetailsData(counts, zpid);
      setDetails(details)
    } catch (error) {
      setMessage(processError("fetchDetailsData", error))
      setDetails({})
      setOpenSnack(true)
    } finally {
      setDetailsLoading(false);
    }
  }

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Tabs
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const [sourceTabValue, setSourceTabValue] = useState("zillow");

  const handleSourceTabChange = (event, newValue) => {
    setSourceTabValue(newValue);
  };

  const a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const handleChangeDebugMenu = (e, key) => {
    setDebugOptions(prev => {
      return {
        ...debugOptions,
        [key]: e.target.value
      }
    })
  }

  const handleChangeCheckbox = (event) => {
    setDebugOptions(prev => {
      return {
        ...debugOptions,
        forceCleanSessionsCreation: event.target.checked
      }
    })
  };

  const openDebugMenu = Boolean(anchorEl);
  const handleDebugClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDebugClose = () => {
    setAnchorEl(null);
  };

  if (searchParams.has("datasetid")) {
    if (datasetId === "") {
      setDatasetId(searchParams.get("datasetid"));
    }
  }

  const [dataset, setDataset] = useState('');

  const handleDatasetChange = (event) => {
    setDataset(event.target.value);
  };

  const handleDatasetSearch = async () => {
    setLoading(true);
    await loadData(dataset);
  }

  const [datasetLoading, setDatasetLoading] = useState(false)
  const [datasets, setDatasets] = useState([])

  const handleDatasetClick = async (event) => {
    if (datasets.length === 0) {
      // update dropdown
      try {
        setDatasetLoading(true)
        const datasets = await fetchDatasets();
        setDatasets(datasets);
      }
      catch (error) {
        setMessage(processError("fecthDatasets", error))
        setOpenSnack(true)
        setDatasets([])
      }
      finally {
        setDatasetLoading(false)
      }

    }
  }

  const [newOpen, setNewOpen] = useState(true)
  const handleWhatsNewClick = () => setNewOpen(prev => !prev)

  const handleSliderChange = (event, newValue) => {
    setDebugOptions(prev => {
      return {
        ...debugOptions,
        maxConcurrency: newValue
      }
    })
  };

  const handleInputChange = (event) => {
    setDebugOptions(prev => {
      return {
        ...debugOptions,
        maxConcurrency: event.target.value === '' ? 0 : Number(event.target.value)
      }
    })
  };

  const handleBlur = () => {
    if (debugOptions.maxConcurrency < 1) {
      setDebugOptions(prev => {
        return {
          ...debugOptions,
          maxConcurrency: 1
        }
      })
    } else if (debugOptions.maxConcurrency > 50) {
      setDebugOptions(prev => {
        return {
          ...debugOptions,
          maxConcurrency: 50
        }
      })
    }
  };

  return (
    <>
      <Container disableGutters fixed maxWidth={false}>
        <Grid container spacing={5} alignItems="left">
          <Grid
            item
            xs={6}
            sm={6}
            md={6}
          >
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

              <LoadingButton sx={{ paddingLeft: 1, paddingRight: 1 }} loading={isLoading || datasetLoading} loadingIndicator="Fetching..." variant="contained" onClick={handleClick}>
                <FontAwesomeIcon icon={icon({ name: 'search' })} fixedWidth style={iconButtonFAStyle} />
                Search
              </LoadingButton>

            </Paper>
            <Paper
              component="form"
              elevation={0}
              sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: "100%" }}
            >
              <Typography variant="body2">Or choose from:</Typography>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small" variant="standard" >
                <InputLabel id="demo-select-small-label">Dataset</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="demo-select-small"
                  value={dataset}
                  label="Dataset ID"
                  onChange={handleDatasetChange}
                  onOpen={handleDatasetClick}
                >
                  {datasetLoading ? [
                    <CircularProgress key={0} size={20} />,
                    <Typography key={1} variant="caption">Updating...</Typography>
                  ] : (
                    (datasets.length > 0) && (datasets.map(ds => (
                      [
                        <Divider key={`${ds.value}0`}>
                          <Typography variant="caption">{ds.date}</Typography>
                        </Divider>
                        ,
                        <MenuItem key={`${ds.value}1`} value={ds.value}>
                          {/* <ListItemIcon>
                            <FontAwesomeIcon icon={icon({ name: 'database' })} />
                          </ListItemIcon> */}
                          <ListItemIcon>
                            {ds.highlight && <FontAwesomeIcon icon={icon({ name: 'check' })} size="xs" />}
                          </ListItemIcon>
                          <ListItemText primary={
                            <Typography component="span" variant="body2">
                              {ds.searchBy}: <strong>{ds.search}</strong>
                            </Typography>
                          } secondary={
                            <React.Fragment>
                              <Typography
                                sx={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {ds.elapsedTime} - Count:  <b>{DisplayNumber.format(ds.counts.agent)}</b> - Details: <b>{DisplayNumber.format(ds.counts.listings)}</b>
                              </Typography>
                              {/* <br />
                              <Typography variant="caption" >{ds.value} - {ds.build}</Typography> */}
                            </React.Fragment>
                          } />
                        </MenuItem>
                      ]
                    ))))}
                </Select>
              </FormControl>
              <LoadingButton loading={isLoading || datasetLoading} loadingIndicator="Fetching..." variant="contained" onClick={handleDatasetSearch}>
                <FontAwesomeIcon icon={icon({ name: 'download' })} fixedWidth style={iconButtonFAStyle} />
                Get Dataset
              </LoadingButton>
            </Paper>
          </Grid>
          <Grid item xs={6}
            sm={6}
            md={6}>
            <Button
              id="basic-button"
              variant="text"
              onClick={handleWhatsNewClick}
            >
              <Switch size="small" checked={newOpen} />
              What's New:
            </Button>
            <Divider />
            <Collapse in={newOpen}>
              <WhatsNew />
            </Collapse>
            {hasDebugMenu && (
              <>
                <Button
                  id="basic-button"
                  onClick={handleDebugClick}
                >
                  Debug Menu
                </Button>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={openDebugMenu}
                  onClose={handleDebugClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  <MenuItem>
                    <Stack spacing={2}>
                      <TextField
                        id="outlined-error"
                        label="Build Number"
                        size="small"
                        InputProps={{
                          startAdornment: <FontAwesomeIcon icon={icon({ name: 'hammer' })} />,
                        }}
                        defaultValue={BUILD}
                        value={debugOptions.buildNumber}
                        onChange={(e) => handleChangeDebugMenu(e, "buildNumber")}
                      />
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-simple-select-helper-label">Select Scraper</InputLabel>
                        <Select
                          labelId="demo-select-small-label"
                          id="demo-select-small"
                          value={debugOptions.scraper}
                          label="Select scraper"
                          onChange={(e) => handleChangeDebugMenu(e, "scraper")}
                        >
                          {SCRAPER.map(scraper => (
                            <MenuItem value={scraper} key={scraper}>{scraper}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-simple-select-helper-label">Select Proxy</InputLabel>
                        <Select
                          labelId="demo-select-small-label"
                          id="demo-select-small"
                          value={debugOptions.proxyType}
                          label="Select proxy"
                          onChange={(e) => handleChangeDebugMenu(e, "proxyType")}
                        >
                          {PROXYTYPE.map(proxy => (
                            <MenuItem value={proxy} key={proxy}>{proxy}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-simple-select-helper-label">Select Datastore Type</InputLabel>
                        <Select
                          labelId="demo-select-small-label"
                          id="demo-select-small"
                          value={debugOptions.dataSavingStoreType}
                          label="Select Datastore Type"
                          onChange={(e) => handleChangeDebugMenu(e, "dataSavingStoreType")}
                        >
                          {DATASTORETYPE.map(store => (
                            <MenuItem value={store} key={store}>{store}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Box sx={{ width: 250 }}>
                        <Typography id="input-slider" gutterBottom>
                          Maximum Concurrency
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs>
                            <Slider
                              max={50}
                              min={1}
                              value={typeof debugOptions.maxConcurrency === 'number' ? debugOptions.maxConcurrency : 1}
                              onChange={handleSliderChange}
                              aria-labelledby="input-slider"
                            />
                          </Grid>
                          <Grid item>
                            <Input
                              value={debugOptions.maxConcurrency}
                              size="small"
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              inputProps={{
                                step: 1,
                                min: 1,
                                max: 50,
                                type: 'number',
                                'aria-labelledby': 'input-slider',
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                      <FormControlLabel control={<Checkbox checked={debugOptions.forceCleanSessionsCreation} onChange={handleChangeCheckbox} size="small" />} label="Force Clean Sessions Creation" />
                    </Stack>
                  </MenuItem>
                </Menu>
                <br />
                <Typography variant="caption">
                  build: <strong>{debugOptions.buildNumber}</strong><br />
                  scraper: <strong>{debugOptions.scraper}</strong><br />
                  proxy: <strong>{debugOptions.proxyType}</strong><br />
                  dataSavingStoreType: <strong>{debugOptions.dataSavingStoreType}</strong><br />
                  maxConcurrency: <strong>{debugOptions.maxConcurrency}</strong><br />
                  forceCleanSessionsCreation: <strong>{debugOptions.forceCleanSessionsCreation.toString()}</strong><br />

                </Typography>
              </>
            )}
          </Grid>
          <Grid item>
            {isLoading ? <CircularProgressTimer onUpdate={(sec) => {
              setLoadTime(sec)
            }} />
              :
              //<DataGrid rows={rows} columns={columns} />
              (Object.keys(counts).length > 0) && (
                <>
                  <Box
                    sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: "100%" }}
                  >
                    <Tabs
                      value={sourceTabValue}
                      onChange={handleSourceTabChange}
                      aria-label="basic tabs example"
                      orientation="vertical"
                      variant="scrollable"
                      sx={{ marginTop: 14 }}
                    >
                      <Tab label="Zillow" {...a11yProps(0)} value="zillow" variant="v" />
                      <Tab label="Redfin" {...a11yProps(1)} value="redfin" variant="v" />
                      <Tab label="Realtor" {...a11yProps(2)} value="realtor" variant="v" />
                      <Tab label="Landwatch" {...a11yProps(3)} value="landwatch" variant="v" />
                      <Tab label="MLS" {...a11yProps(4)} value="mls" variant="v" />
                    </Tabs>
                    <Box>
                      <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
                        <Tab label="Sales & Listings" {...a11yProps(0)} value={0} variant="h" />
                        <Tab label="List/Sale Ratio" {...a11yProps(2)} value={2} variant="h" />
                        <Tab label="Months of Supply" {...a11yProps(4)} value={4} variant="h" />
                        <Tab label="Absorption Rate" {...a11yProps(4)} value={7} variant="h" />
                        <Tab label="Average Prices" {...a11yProps(1)} value={1} variant="h" />
                        <Tab label="Price Per Acre" {...a11yProps(3)} value={3} variant="h" />
                        <Tab label="Days on Market" {...a11yProps(5)} value={5} variant="h" />
                        <Tab label="Realtors" {...a11yProps(6)} value={6} variant="h" />
                      </Tabs>
                      {(tabValue === 6) && (counts.meta.hasDetails) ? (
                        <BrokerageTable data={counts} />
                      ) : (
                        <ZillowTable loadTime={loadTime} area={area} date={countsDate} source={sourceTabValue} value={tabValue} data={counts} onClick={(e, p) => toggleDrawer(e, p)} />
                      )}
                    </Box>
                  </Box>
                </>
              )}
          </Grid>
        </Grid>
      </Container>
      {/* Footer */}
      <Container
        maxWidth="md"
        component="footer"
        sx={{
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          mt: 8,
          py: [3, 6],
        }}
      >
        <Copyright sx={{ mt: 5 }} />
      </Container>
      {/* End footer */}
      <Drawer
        anchor="bottom"
        open={openDrawer}
        onClose={() => toggleDrawer(false)}
      >
        <Typography align="center" variant="h6" gutterBottom color="primary">{drawerTitle}</Typography>
        <Container>
          <Box>
            {isListingLoading ? <CircularProgress /> : <ListingsView listings={listings} onDetailsClick={(zpid) => openDetails(zpid)} />}
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
            {isDetailsLoading ? <CircularProgress /> : (
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
        <Alert severity="error">An error has occured.  Please try again later<br />
          Message: {message}</Alert>
      </Snackbar>
    </>
  );
}

export default App;
