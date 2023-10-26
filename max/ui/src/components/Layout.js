import { ThemeProvider } from "@emotion/react"
import { AppBar, Link, Button, CssBaseline, GlobalStyles,  Toolbar, Typography, Container } from "@mui/material"
import { defaultTheme } from "../constants/theme.js";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import {  BUILD, PROXYTYPE, SCRAPER, iconButtonFAStyle } from "../constants/constants.js";
import { useState } from "react";

import PropTypes from 'prop-types';

import { Link as RouterLink } from 'react-router-dom';


const Layout = ({ children, title }) => {
    const isTestingSite = document.location.hostname.includes("sunburst") || document.location.hostname.includes("localhost")

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