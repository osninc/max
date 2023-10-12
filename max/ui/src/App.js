import React, { useState } from "react";

import { createTheme, ThemeProvider } from '@mui/material/styles';
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

import TextField from '@mui/material/TextField';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import axios from './axios.js';
import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import { Alert, Box, CircularProgress, Divider, Drawer, FormControl, FormControlLabel, FormLabel, IconButton, InputLabel, Menu, MenuItem, Modal, Paper, Select, Snackbar, Stack, Switch, Tab, Tabs, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { processError } from "./error.js";



import { serialize } from 'object-to-formdata';

import testCounts from "./data/countsWithListings.json";
import testListings from "./data/listings.json";
import testDetails from "./data/details.json";


import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import { defaultHeaders, graphqlHeaders } from "./headers.js";

import { DetailsView } from "./components/DetailsView.js";
import { alphaNumWithoutSpace, sqft2acre, USDollar, convertStrToAcre, calcRatio, calcAbsorption } from "./functions/functions.js"
import { APIFY, BUILD, USETEST, srcset, modalStyle } from "./constants/constants.js";
import { Copyright } from "./components/Copyright.js"
import { ZillowTable } from "./components/ZillowTable.js";
import { timeMatrix } from "./constants/matrix.js";
import SelectLocation from "./components/SelectLocation.js";
import { ThirdPartyIcon } from "./components/ThirdPartyIcon.js";
import { getPropertyParams } from "./zillowGraphQl.js";
import ListingsView from "./components/ListingsView.js";


// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

const calcAvgPrice = listings => {
  if ((typeof listings === 'undefined') || (listings.length === 0)) return 0;
  //const numListings = listings.length;
  const listOfPrices = listings.map(listing => parseFloat(listing.price.replace("$", "").replaceAll(",", ""))).filter(el => el)
  const totalPrices = listOfPrices.reduce((a, b) => a + b, 0)
  const numListings = listOfPrices.length;

  return (numListings === 0) ? 0 : (totalPrices / numListings).toFixed(0);
}

const calcPPA = listings => {
  if ((typeof listings === 'undefined') || (listings.length === 0)) return 0;

  // Convert to individual price/acre
  const newListings = listings.map(listing => {
    const price = parseFloat(listing.price.replace("$", "").replaceAll(",", ""))
    const acre = convertStrToAcre(listing.lotAreaString)

    if (!isNaN(price && acre))
      return (acre === 0) ? 0 : (price / acre)
    else
      return (price && acre)
  }).filter(el => el)

  const totalPrices = newListings.reduce((a, b) => a + b, 0)
  const numListings = newListings.length

  return (numListings === 0) ? 0 : (totalPrices / numListings).toFixed(0)
}

const normalizeTheData = data => {
  let c = {}
  //console.log(data)
  // Put everything in an object to reference faster and easier
  //console.log({ data })
  data.map((count, i) => {
    //console.log({count})
    if (count.status !== undefined) {
      const timeDim = (count.status?.toLowerCase() === "sold") ? count?.soldInLast?.toLowerCase() : count?.daysOnZillow?.toLowerCase();
      //console.log({ timeDim })
      if (timeDim)
        c[count.acreage?.toLowerCase()] = {
          ...c[count.acreage?.toLowerCase()],
          [timeDim.toLowerCase()]: {
            ...(c[count.acreage?.toLowerCase()] ? c[count.acreage?.toLowerCase()][timeDim?.toLowerCase()] : {}),
            timeStamp: count.timeStamp,
            [count.status?.toLowerCase()]: {
              count: count.agentCount,
              url: count.url,
              listings: count.listings,
              mapCount: count.mapCount,
              otherCount: count.otherCount,
              //agentCount: count.agentCount,
              avgPrice: calcAvgPrice(count.listings),
              ppa: calcPPA(count.listings)
            }

          }
        }
    }
  })

  //console.log("here")

  // Added calculated values
  Object.keys(c).map(acreage => {
    Object.keys(c[acreage]).map(time => {
      c[acreage][time] = {
        ...c[acreage][time],
        ratio: calcRatio(c[acreage][time]["for sale"]?.count, c[acreage][time]["sold"]?.count),
        absorption: calcAbsorption(c[acreage][time]["for sale"]?.count, c[acreage][time]["sold"]?.count)

      }
    })
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
  const [scraper, setScraper] = useState("axios");
  const [proxy, setProxy] = useState("smartproxy-residential")
  const [anchorEl, setAnchorEl] = useState(null);


  const searchParams = new URLSearchParams(document.location.search);

  const hasDebugMenu = searchParams.has("debugMenu")
  const hasBuildOnQS = searchParams.has("build")
  const isTestingSite = document.location.hostname.includes("sunburst") || document.location.hostname.includes("localhost")

  const [buildNumber, setBuildNumber] = useState(hasBuildOnQS ? searchParams.get("build") : BUILD);

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
          setDrawerTitle(`(${p.count}) ${sizeStr} acre lots in ${area} ${saleText} within last ${timeText}`)
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

  const fetchData = async () => {
    setMessage("");
    setLoading(true);

    // Initialize the ApifyClient with API token
    // const client = new ApifyClient({
    //   token: "apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H",
    // });
    let searchBy = "county"
    // figure out what kind of search it is
    if (search.length === 2)
      searchBy = "state"
    if (search.length === 5)
      searchBy = "zipCode"

    // Prepare Actor input
    const input = {
      searchBy,
      [searchBy]: search,
      proxy,
      scraper,
      "debug": false
    };

    setSearchBy(searchBy)

    const url = APIFY.counts[APIFY.counts.use].replace("<BUILD>", buildNumber);

    const finalObj = {
      params: input,
      method: APIFY.counts.method,
      url
    }

    const formData = serialize(input);

    try {
      // Run the Actor and wait for it to finish
      //const run = await client.actor("DfRN94Fcs8WeKNY9h/OVT9EXRpZMjSZ2lhS").call(input);

      // Fetch and print Actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      // const { items } = await client.dataset(run.defaultDatasetId).listItems();
      // items.forEach((item) => {
      //   console.dir(item);
      // });

      let data;
      //if (USETEST.counts)
      if (testData.includes("counts"))
        data = testCounts
      else {
        //let u2 = "https://api.apify.com/v2/datasets/ImVQ7f8FZwIERq833/items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H"
        //let u2 = "https://api.apify.com/v2/datasets/rkaR7VOOWWYSC8UAS/items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H"
        //const response = await axios.get(u2)
        const response = await axios.post(url, input);
        data = response.data
      }

      // Get the name of area
      setArea(search)
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

    const url = APIFY.listings.realTime

    const formData = serialize(params);

    const i = {
      "county": "Cook County, IL",
      "debug": true,
      "doz": "7",
      "proxy": "none",
      "status": "sale"
    }

    try {
      // Run the Actor and wait for it to finish
      //const run = await client.actor("DfRN94Fcs8WeKNY9h/OVT9EXRpZMjSZ2lhS").call(input);

      // Fetch and print Actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      // const { items } = await client.dataset(run.defaultDatasetId).listItems();
      // items.forEach((item) => {
      //   console.dir(item);
      // });
      const data = counts[lot][time][status].listings

      //if (USETEST.listings)
      // if (testData.includes("listings"))
      //   //data = testListings
      // else {
      //   const response = await axios.post(url, params);
      //   data = response.data
      // }

      //data = 

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


    let finalConfig = {
      //headerGeneratorOptions: { ...randomHeaders },
      headers: {
        ...defaultHeaders,
        Referer: "https://www.zillow.com/",
        "Referrer-Policy": "unsafe-url",
      },
    }

    const graphQlHeaders = {
      'authority': 'www.zillow.com',
      'method': 'POST',
      'path': `/graphql/?zpid=${zpid}`,
      'scheme': 'https',
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en',
      'content-type': 'text/plain',
      'dnt': '1',
      'origin': 'https://www.zillow.com',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
    }

    const graphQlParams = getPropertyParams(zpid)

    let baseConfig = {
      //headerGeneratorOptions: { ...randomHeaders },
      headers: {
        ...defaultHeaders,
        Referer: "https://www.zillow.com/",
        "Referrer-Policy": "unsafe-url"
      },
      responseType: "json"
    }



    //console.log(params.extensions.toString());

    //const finalUrl = `${url}/?extensions=${encodeURIComponent(JSON.stringify(params.extensions))}&variables=${encodeURIComponent(JSON.stringify(params.variables))}`
    //console.log({ finalUrl })
    //const formData = serialize(params);

    try {
      // Run the Actor and wait for it to finish
      //const run = await client.actor("DfRN94Fcs8WeKNY9h/OVT9EXRpZMjSZ2lhS").call(input);

      // Fetch and print Actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      // const { items } = await client.dataset(run.defaultDatasetId).listItems();
      // items.forEach((item) => {
      //   console.dir(item);
      // });
      let data;
      //if (USETEST.details)
      if (testData.includes("details")) {
        // console.log("user")
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
        // const graphQlParams = getPropertyParams(zpid)

        // const baseConfig = {
        //   //headerGeneratorOptions: { ...randomHeaders },
        //   headers: {
        //     ...defaultHeaders,
        //     Referer: "https://www.zillow.com/",
        //     "Referrer-Policy": "unsafe-url"
        //   },
        //   responseType: "json"
        // }

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
    await fetchData();
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

  const a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  const handleScraperChange = (e) => {
    //console.log(e.target.value)
    setScraper(e.target.value)
  }

  const handleProxyChange = (e) => {
    //console.log(e.target.value)
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

  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: 'none' } }} />
      <CssBaseline />
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            land-stats.com
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
                          <MenuItem value="axios">axios</MenuItem>
                          <MenuItem value="got">got</MenuItem>
                          <MenuItem value="crawlee">crawlee</MenuItem>
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
                          {/* <MenuItem value="none">none</MenuItem> */}
                          <MenuItem value="smartproxy-residential">Smartproxy Residential</MenuItem>
                          <MenuItem value="apify-residential">Apify Residential</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <FormLabel id="demo-simple-select-helper-label">Select which will use test data</FormLabel>
                        <ToggleButtonGroup
                          color="primary"
                          value={testData}
                          onChange={handleTestChange}
                          size="small"
                        >
                          <ToggleButton value="counts">Counts</ToggleButton>
                          <ToggleButton value="details">Details</ToggleButton>
                        </ToggleButtonGroup>
                      </FormControl>
                    </Stack>
                  </MenuItem>
                </Menu>
              </>
            )}

            <Link
              variant="button"
              color="text.primary"
              href="#"
              sx={{ my: 1, mx: 1.5 }}
            >
              Features
            </Link>
            <Link
              variant="button"
              color="text.primary"
              href="#"
              sx={{ my: 1, mx: 1.5 }}
            >
              Enterprise
            </Link>
            <Link
              variant="button"
              color="text.primary"
              href="#"
              sx={{ my: 1, mx: 1.5 }}
            >
              Support
            </Link>
          </nav>
          <Button href="#" variant="outlined" sx={{ my: 1, mx: 1.5 }}>
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
              <IconButton sx={{ p: '10px' }} aria-label="menu">
                <FontAwesomeIcon icon={icon({ name: 'map-pin' })} />
              </IconButton>
              <SelectLocation onChange={(value) => handleTextChange(value)} />

              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />

              <LoadingButton loading={isLoading} loadingIndicator="Fetching..." variant="contained" onClick={handleClick}>
                <FontAwesomeIcon icon={icon({ name: 'search' })} fixedWidth />
                Search
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
            {isLoading ? <CircularProgress /> :
              //<DataGrid rows={rows} columns={columns} />
              (Object.keys(counts).length > 0) && (
                <>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
                    <Tab label="Sales & Listings" {...a11yProps(0)} value={0} />
                    <Tab label="List/Sale Ratio" {...a11yProps(2)} value={2} />
                    <Tab label="Months of Supply" {...a11yProps(4)} value={4} />
                    <Tab label="Average Prices" {...a11yProps(1)} value={1} />
                    <Tab label="Price Per Acre" {...a11yProps(3)} value={3} />
                    <Tab label="Days on Market" {...a11yProps(5)} value={5} />
                    <Tab label="Realtors" {...a11yProps(6)} value={6} />
                  </Tabs>
                  <ZillowTable area={area} date={countsDate} value={tabValue} data={counts} onClick={(e, p) => toggleDrawer(e, p)} />
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
        <Typography align="center" variant="h4" gutterBottom>{drawerTitle}</Typography>
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
