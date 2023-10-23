import { ThemeProvider } from "@emotion/react"
import { AppBar, Link, Button, CssBaseline, FormControl, GlobalStyles, InputLabel, Menu, MenuItem, Select, Stack, TextField, Toolbar, Typography, Container } from "@mui/material"
import { defaultTheme } from "../constants/theme.js";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import { APIFY, BUILD, PROXYTYPE, SCRAPER, iconButtonFAStyle, modalStyle } from "../constants/constants.js";
import { useState } from "react";

import PropTypes from 'prop-types';

import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { LinkProps } from '@mui/material/Link';


const Layout = ({ children, title }) => {
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

    const [loadTime, setLoadTime] = useState(0);

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

    const handleBuildChange = e => {
        setBuildNumber(e.target.value)
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: 'none' } }} />
            <CssBaseline />
            <AppBar
                position="static"
                color="transparent"
                elevation={0}
            >
                <Toolbar sx={{ flexWrap: 'wrap' }} variant="dense">
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="none"
                        sx={{ my: 1, mx: 1.5 }}
                    >
                        <Typography variant="h6" color="black" noWrap sx={{ flexGrow: 1 }}>
                            <FontAwesomeIcon icon={icon({ name: 'bullseye' })} fixedWidth color={defaultTheme.palette.primary.main} />
                            Land Stats Logo
                        </Typography>
                    </Link>
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
                            component={RouterLink}
                            to="/runs"
                            underline="none"
                            sx={{ my: 1, mx: 1.5 }}
                        >
                            Run stats
                        </Link>
                        <Link
                            component={RouterLink}
                            variant="button"
                            color="primary"
                            to="/features"
                            underline="none"
                            sx={{ my: 1, mx: 1.5 }}
                        >
                            Features
                        </Link>
                        <Link
                            component={RouterLink}
                            variant="button"
                            color="primary"
                            to="/pricing"
                            underline="none"
                            sx={{ my: 1, mx: 1.5 }}
                        >
                            Pricing
                        </Link>
                        <Link
                            component={RouterLink}
                            variant="button"
                            color="primary"
                            to="/faq"
                            underline="none"
                            sx={{ my: 1, mx: 1.5 }}
                        >
                            FAQ's
                        </Link>
                        <Link
                            variant="button"
                            color="primary"
                            component={RouterLink}
                            to="/about"
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
                    component="h2"
                    variant="h2"
                    align="center"
                    color="primary"
                    gutterBottom
                >
                    {title}
                </Typography>
            </Container>
            {/* End hero unit */}
            {children}
        </ThemeProvider>
    )
}


Layout.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string.isRequired
};

Layout.defaultProps = {
    title: "Search Land Comps"
}

export default Layout;