import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { createRef, useEffect, useRef, useState } from 'react';
import { getSum } from '../../functions/formulas';
import { Card, CardContent, CardMedia, IconButton, Tooltip, Typography } from '@mui/material';
import { createRoot } from 'react-dom/client';

import { SOURCE } from '../../constants/constants.js';
import { USDollar, getZillowUrl } from '../../functions/functions';
import { ThirdPartyIcon } from '../ThirdPartyIcon';

import GiteIcon from '@mui/icons-material/Gite';

mapboxgl.accessToken = "pk.eyJ1IjoibGFuZHN0YXRzIiwiYSI6ImNsbHd1cDV5czBmNjQzb2xlbnE4c2F6MDkifQ.8VJ8wEZCS_jJFbvtOXwSng";

const markerStyle = {
    backgroundColor: SOURCE.zillow.color,
    border: "1px solid blue",
    color: "white",
    padding: 4,
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    fontSize: 16,
    margin: "4px 2px",
    borderRadius: "50%"
}

const mapContainerStyle = {
    //position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: 500,
    width: 700,
    border: "1px black solid"
}

const sidebarStyle = {
    backgroundColor: "rgba(35, 55, 75, 0.9)",
    color: "#fff",
    padding: "2px 6px",
    fontFamily: "monospace",
    zIndex: 1,
    position: "relative",
    top: 0,
    left: 0,
    margin: 0,
    marginBottom: 2,
    borderRadius: 4
}

const findCenter = listings => {
    if (listings.length === 0) return {
        lng: 0,
        lat: 0
    }
    const aryOfLat = listings.map(l => l.latitude).filter(el => el)
    const lat = getSum(aryOfLat)
    const aryOfLng = listings.map(l => l.longitude).filter(el => el)
    const lng = getSum(aryOfLng)

    return {
        lng: (aryOfLng.length === 0) ? 0 : (lng / aryOfLng.length),
        lat: (aryOfLat.length === 0) ? 0 : (lat / aryOfLat.length)
    }
}

const Marker = ({ children, listing }) => {
    const htmlTitle = 
        <Card>
            <CardMedia
                sx={{ height: 140 }}
                image={listing.imgSrc}
                title={listing.zpid}
            />
            <CardContent>
                <Typography gutterBottom variant="subtitle1" component="div">
                    {listing.streetAddress}<br/>{listing.city}, {listing.state} {listing.zipcode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    price: {USDollar.format(listing.unformattedPrice)}<br/>
                    acreage: {listing.acre} acres<br/>
                    price per acre: {USDollar.format(listing.unformattedPpa)}<br />
                    lat: {listing.latitude}<br/>
                    lng: {listing.longitude}<br/>
                </Typography>
            </CardContent>
        </Card>


    return (
        <Tooltip title={htmlTitle} placement="top">
            <IconButton style={markerStyle} href={getZillowUrl(listing.zpid)} rel="noreferrer" target="_blank">
                <ThirdPartyIcon site="zillow" fixedWidth size="sm"/> 
            </IconButton>
        </Tooltip>
    );
};


export const MapView = ({ listings, onClick }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const center = findCenter(listings)
    const [zoom, setZoom] = useState(9)
    const [lng, setLng] = useState(center.lng);
    const [lat, setLat] = useState(center.lat);


    const markerClicked = (title) => {
        window.alert(title);
    };

    // Initialize map when component mounts
    useEffect(() => {
        if (map.current) return;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [lng, lat],
            zoom: zoom,
        });

        // Create default markers
        listings.map(listing => {
            // Create a React ref
            const ref = createRef();
            // Create a new DOM node and save it to the React ref
            ref.current = document.createElement('div');
            // Render a Marker Component on our new DOM node
            createRoot(ref.current).render(
                <Marker onClick={markerClicked} listing={listing} />
            );

            const f = new mapboxgl.Marker(ref.current).setLngLat([listing.longitude, listing.latitude]).addTo(map.current)
        })

        // Add navigation control (the +/- zoom buttons)
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });
    });

    return (
        <div>
            <div style={sidebarStyle}>
                Longitude: {center.lng} | Latitude: {center.lat} | Zoom: {zoom}
            </div>
            <div ref={mapContainer} style={mapContainerStyle} />
        </div>
    )
}