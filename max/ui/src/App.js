import React, { useState } from "react";

import { ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import GlobalStyles from '@mui/material/GlobalStyles';
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';

import Timer from "./components/Timer.js";

import TextField from '@mui/material/TextField';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import axios from './axios.js';
import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import { Alert, Avatar, Box, Chip, CircularProgress, Divider, Drawer, FormControl, FormLabel, IconButton, InputLabel, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Menu, MenuItem, Modal, Paper, Select, Snackbar, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { processError } from "./error.js";

import testCounts from "./data/countsWithListings.json";
//import testListings from "./data/listings.json";
import testDetails from "./data/details.json";

import { defaultHeaders } from "./headers.js";

import { DetailsView } from "./components/DetailsView.js";
import { convertStrToAcre, convertPriceStringToFloat, convertDateToLocal, sec2min, time2epoch, DisplayNumber } from "./functions/functions.js"
import { sqft2acre, calcRatio, calcAbsorption, calcMos, calcPpa, getListOfField, getSum } from "./functions/formulas.js"

import { APIFY, BUILD, PROXYTYPE, SCRAPER, iconButtonFAStyle, modalStyle } from "./constants/constants.js";
import { Copyright } from "./components/Copyright.js"
import { ZillowTable } from "./components/ZillowTable.js";
import { timeMatrix } from "./constants/matrix.js";
import SelectLocation from "./components/SelectLocation.js";
import { getPropertyParams } from "./zillowGraphQl.js";
import ListingsView from "./components/ListingsView.js";
import { CircularProgressTimer } from "./components/Listings/CircularProgressTimer.js";

import { defaultTheme } from "./constants/theme.js";
import TabPanel from "./components/TabPanel.js";

const calcAvgPrice = ary => {
  if ((typeof ary === 'undefined') || (ary.length === 0)) return 0;

  const listOfPrices = getListOfField(ary, "unformattedPrice")
  const totalPrices = getSum(listOfPrices)
  const numListings = listOfPrices.length;

  return (numListings === 0) ? 0 : parseInt((totalPrices / numListings).toFixed(0));
}

const calcAvgPpa = ary => {
  if ((typeof ary === 'undefined') || (ary.length === 0)) return 0;

  const listOfPpa = getListOfField(ary, "unformattedPpa")
  const totalPpa = getSum(listOfPpa)
  const numListings = listOfPpa.length;

  return (numListings === 0) ? 0 : parseInt((totalPpa / numListings).toFixed(0));
}

const fixListings = listings => {
  const f = listings.map(listing => {
    const newPrice = convertPriceStringToFloat(listing.price)
    const newAcre = convertStrToAcre(listing.lotAreaString)
    const newPpa = calcPpa(newPrice, newAcre);
    //console.log({ newPpa })
    // replace all google images
    const newImage = (listing.imgSrc.includes("googleapis.com")) ? "/no-image.png" : listing.imgSrc
    // if (listing.imgSrc.includes("googleapis"))
    //   console.log(listing.imgSrc)
    return {
      ...listing,
      unformattedPrice: newPrice,
      acre: newAcre,
      unformattedPpa: newPpa,
      imgSrc: newImage,
      originalImgSrc: listing.imgSrc
    }
  })
  return f
}

const normalizeTheData = data => {
  let c = {}
  // Put everything in an object to reference faster and easier
  data.map((count, i) => {
    if (count.status !== undefined) {
      const timeDim = (count.status?.toLowerCase() === "sold") ? count?.soldInLast?.toLowerCase() : count?.daysOnZillow?.toLowerCase();

      if (timeDim) {
        const fixedListings = fixListings(count.listings);
        const listOfPrices = getListOfField(fixedListings, "unformattedPrice")
        const numPrices = listOfPrices.length
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
              avgPpa: calcAvgPpa(fixedListings)
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

  //console.log({ c })

  return c
};

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
  const [scraper, setScraper] = useState(SCRAPER[0]);
  const [proxy, setProxy] = useState(PROXYTYPE[0])
  const [anchorEl, setAnchorEl] = useState(null);

  const searchParams = new URLSearchParams(document.location.search);

  const hasDebugMenu = searchParams.has("debugMenu")
  const hasBuildOnQS = searchParams.has("build")
  const isTestingSite = document.location.hostname.includes("sunburst") || document.location.hostname.includes("localhost")

  const [buildNumber, setBuildNumber] = useState(hasBuildOnQS ? searchParams.get("build") : BUILD);

  const [datasetId, setDatasetId] = useState("")

  const [loadTime, setLoadTime] = useState(0)

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
              proxy,
              status: saleText,
              time: timeText
            }
          );
        }

      }
      return !openDrawer
    })
  }

  const fetchData = async (ds) => {
    setMessage("");
    setLoading(true);

    let searchBy = "county"
    // figure out what kind of search it is
    if (search.length === 2)
      searchBy = "state"
    if (search.length === 5)
      searchBy = "zipCode"

    // Prepare Actor input
    const input = {
      searchType: searchBy,
      [searchBy]: search,
      proxyType: proxy,
      scraper,
      "debug": false
    };

    setSearchBy(searchBy)

    let axiosObj;

    if (ds === "") {
      const url = `${APIFY.base.url}${APIFY.counts.endPoint}?token=${APIFY.base.token}&build=${buildNumber}`;

      axiosObj = {
        data: input,
        method: APIFY.counts.method,
        url
      }
    }
    else {
      const url = `${APIFY.datasets.realTime.replace("<DATASETID>", ds)}?token=${APIFY.base.token}`
      //console.log({ url })
      axiosObj = {
        method: APIFY.datasets.method,
        url
      }
    }

    //console.log({ axiosObj })

    try {
      let data;
      if (testData.includes("counts"))
        data = testCounts
      else {
        const response = await axios(axiosObj);
        data = response.data
      }

      // Get the name of area
      // Pre-fill all variables
      const data1 = data[1];
      let newSearch = search;
      if (data1["county"] !== "") {
        newSearch = data1["county"];
        setSearchBy("county")
        setSearch(newSearch)
      }
      if (data1["zipCode"] !== "") {
        newSearch = data1["zipCode"];
        //console.log({ newSearch })
        setSearchBy("zipCode")
        setSearch(data1["zipCode"])
      }
      if (data1["state"] !== "") {
        newSearch = data1["state"];
        setSearchBy("state")
        setSearch(data1["state"])
      }

      setArea(newSearch)
      setCountsDate(data[1]?.timeStamp)

      const normalizedData = normalizeTheData(data)
      setCounts(normalizedData)
    } catch (error) {
      setMessage(processError("fetchData", error))
      setOpenSnack(true)
    } finally {
      setLoading(false);
    }
  }

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

  const fetchDetailsData = async (zpid) => {
    setMessage("")
    setDetailsLoading(true);

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

      let data;
      if (testData.includes("details")) {
        data = testDetails
      }
      else {
        const response = await axios.post(url, graphQlParams, baseConfig)
        data = response.data

      }

      setDetails(data)



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
        setDetails(data[0])
      }
      catch (error2) {
        setMessage(processError("fetchDetailsData", error2))
        setDetails({})
        setOpenSnack(true)
      }
    } finally {
      setDetailsLoading(false);
    }
  }


  const handleClick = async () => {
    setLoading(true);
    await fetchData("");
  }

  const handleTextChange = e => {
    setSearch(e)
  }

  const openDetails = async (zpid) => {
    handleOpenModal()
    await fetchDetailsData(zpid);
  }

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleBuildChange = e => {
    setBuildNumber(e.target.value)
  }

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
  const handleScraperChange = (e) => {
    setScraper(e.target.value)
  }

  const handleProxyChange = (e) => {
    setProxy(e.target.value)
  }

  const openDebugMenu = Boolean(anchorEl);
  const handleDebugClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleDebugClose = () => {
    setAnchorEl(null);
  };

  const [testData, setTestData] = useState(() => []);

  const handleTestChange = (event, newTests) => {
    setTestData(newTests);
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
    await fetchData(dataset);
  }

  const [datasetLoading, setDatasetLoading] = useState(false)
  const [datasets, setDatasets] = useState([])

  const fetchStore = async (storeId) => {
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
      setMessage(processError("fetchStore", error))
      return {
        searchBy: "",
        search: ""
      }
    }
  }

  const fetchCountsData = async (id) => {
    try {
      const url = `${APIFY.datasets.realTime.replace("<DATASETID>", id)}?token=${APIFY.base.token}`
      //console.log({ url })
      const axiosObj = {
        method: APIFY.datasets.method,
        url
      }

      const response = await axios(axiosObj);
      const data = response.data

      const filteredData = data.filter(el => el.geoSearchType)
      const listingsCount = filteredData.reduce((a, b) => a + b.mapCount, 0);
      const agentCount = filteredData.reduce((a, b) => a + b.agentCount, 0);
      return {
        counts: {
          listings: listingsCount,
          agent: agentCount
        }
      }
    }
    catch (error) {
      setMessage(processError("fetchListingsData", error))
      return {
        counts: {
          listings: "N/A",
          agent: "N/A"
        }
      }
    }
  }

  const fetchDatasets = async () => {
    try {
      const url = `${APIFY.base.url}${APIFY.runs.endPoint}?token=${APIFY.base.token}&status=SUCCEEDED&desc=true&limit=15`;
      const response = await axios.get(url);
      const data = response.data;

      const aryOfItems = await Promise.all(data.data.items.map(async (item) => {
        const storeId = item.defaultKeyValueStoreId;
        const { searchBy, search } = await fetchStore(storeId);
        // fetch actual data for counts in dropdown (this is redundant TODO:)
        const { counts } = await fetchCountsData(item.defaultDatasetId)
        //console.log({dsData})
        return {
          value: item.defaultDatasetId,
          searchBy: searchBy,
          search: search,
          date: convertDateToLocal(item.startedAt),
          elapsedTime: sec2min(((time2epoch(item.finishedAt) - time2epoch(item.startedAt)) / 1000).toFixed(0)),
          counts,
          text: <><i>{searchBy}</i>:<strong>{search}</strong> <i>{convertDateToLocal(item.startedAt)}</i> <strong>{item.defaultDatasetId}</strong></>
        }
      }))

      setDatasets(aryOfItems)
    }
    catch (error) {
      setMessage(processError("fecthDatasets", error))
      setOpenSnack(true)
      setDatasets([])
    } finally {
      setDatasetLoading(false);
    }
  }
  const handleDatasetClick = async (event) => {
    if (datasets.length === 0) {
      // update dropdown
      setDatasetLoading(true)
      await fetchDatasets()
    }
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: 'none' } }} />
      <CssBaseline />
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
      //sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        <Toolbar sx={{ flexWrap: 'wrap' }} variant="dense">
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            <FontAwesomeIcon icon={icon({ name: 'bullseye' })} fixedWidth color={defaultTheme.palette.primary.main} />
            Land Stats Logo
          </Typography>
          {isTestingSite && (
            <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
              (Testing Site)
            </Typography>
          )}
          <nav>
            {hasDebugMenu && (
              <>
                <Button
                  id="basic-button"
                  onClick={handleDebugClick}
                >
                  Debug Options
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
                        onChange={handleBuildChange}
                      />
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel id="demo-simple-select-helper-label">Select Scraper</InputLabel>
                        <Select
                          labelId="demo-select-small-label"
                          id="demo-select-small"
                          value={scraper}
                          label="Select scraper"
                          onChange={handleScraperChange}
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
                          value={proxy}
                          label="Select proxy"
                          onChange={handleProxyChange}
                        >
                          {PROXYTYPE.map(proxy => (
                            <MenuItem value={proxy} key={proxy}>{proxy}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </MenuItem>
                </Menu>
              </>
            )}

            <Link
              variant="button"
              color="primary"
              href="#"
              underline="none"
              sx={{ my: 1, mx: 1.5 }}
            >
              Features
            </Link>
            <Link
              variant="button"
              color="primary"
              href="#"
              underline="none"
              sx={{ my: 1, mx: 1.5 }}
            >
              Pricing
            </Link>
            <Link
              variant="button"
              color="primary"
              href="#"
              underline="none"
              sx={{ my: 1, mx: 1.5 }}
            >
              FAQ's
            </Link>
            <Link
              variant="button"
              color="primary"
              href="#"
              underline="none"
              sx={{ my: 1, mx: 1.5 }}
            >
              About Us
            </Link>
          </nav>
          <Button href="#" variant="contained" sx={{ my: 1, mx: 1.5 }}>
            <FontAwesomeIcon icon={icon({ name: 'right-to-bracket' })} fixedWidth style={iconButtonFAStyle} />
            Login
          </Button>
        </Toolbar>
      </AppBar>


      {/* Hero unit */}
      <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Search Land Comps
        </Typography>
      </Container>
      {/* End hero unit */}
      <Container disableGutters fixed maxWidth={false}>
        <Grid container spacing={5} alignItems="left">
          <Grid
            item
            xs={9}
            sm={9}
            md={9}
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
                              <br />
                              <Typography variant="caption" >{ds.value}</Typography>
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
          <Grid item xs={3}
            sm={3}
            md={3}>
            {hasDebugMenu && (
              <Typography variant="caption">
                Change these option in the <Link onClick={handleDebugClick} href="#"> debug menu</Link>:<br />
                build: <strong>{buildNumber}</strong><br />
                scraper: <strong>{scraper}</strong><br />
                proxy: <strong>{proxy}</strong><br />
                {(testData.length > 0) && (
                  <div>using test data for <strong>{testData.join(", ")}</strong></div>
                )
                }

              </Typography>
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
                      <ZillowTable loadTime={loadTime} area={area} date={countsDate} source={sourceTabValue} value={tabValue} data={counts} onClick={(e, p) => toggleDrawer(e, p)} />
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


    </ThemeProvider>
  );
}

export default App;
