import { Alert, Avatar, Button, Card, CardActions, CardContent, CardHeader, CardMedia, Checkbox, Collapse, Divider, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import testDetails from "../data/details.json";
import { PriceHistory } from "./PriceHistory.js";
import { modalStyle } from "../constants/constants.js";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { styled } from '@mui/material/styles';
import { useState } from "react";
import { USDollar, convertStrToAcre } from "../functions/functions";
import { ThirdPartyIcon } from "./ThirdPartyIcon";

const getRelaventData = (listings, theData, hasError) => {
    //console.log({ theData })
    if ((Object.keys(theData).length === 0) || theData.errors) {
        return {}
    }
    //if (hasError)
    //    return theData.data.property;

    const propertyDetails = theData.data?.property;
    const address = propertyDetails?.address;
    const listing = listings.find(l => l.zpid.toString() === propertyDetails.zpid.toString())

    const listing2 = listing ? listing : listings[0]
    // if (listing) {

    const {
        imgSrc: image,
        detailUrl,
        statusType: statusText,
        price: unformattedPrice,
        // addressStreet,
        // addressCity,
        // addressState,
        // addressZipcode,
        lotAreaString,
        // beds,
        // baths,
        //area,
        // latLong,
        latitude: lat,
        longitude: lng,
        variableData,
        hdpData,
        brokerName,
    } = listing2;

    //console.log({ propertyDetails })

    // Modify image
    const newImage = (image.includes("googleapis.com")) ? "/no-image.png" : image;

    return {
        zpid: propertyDetails?.zpid,
        image: newImage,
        detailUrl: `https://www.zillow.com/homedetails/${propertyDetails.zpid}_zpid/`,
        statusText,
        unformattedPrice,
        address: `${address.streetAddress}, ${address.city}, ${address.state} ${address.zipcode}`,
        addressStreet: address.streetAddress,
        addressCity: address.city,
        addressState: address.state,
        addressZipcode: address.zipcode,
        price: propertyDetails.price,
        lotAreaString,
        //area,
        lat,
        lng,
        //type: variableData?.type,
        //variableDataText: variableData?.text,
        dateSold: propertyDetails.dateSold,
        lotAreaUnits: propertyDetails.lotAreaUnits,
        parcelNumber: propertyDetails?.resoFacts?.parcelNumber,
        mlsId: propertyDetails?.mlsid,
        agentEmail: propertyDetails?.attributionInfo?.agentEmail,
        agentLicenseNumber: propertyDetails?.attributionInfo?.agentLicenseNumber,
        agentName: propertyDetails?.attributionInfo?.agentName,
        agentPhoneNumber: propertyDetails?.attributionInfo?.agentPhoneNumber,
        attributionTitle: propertyDetails?.attributionInfo?.attributionTitle,
        brokerageName: propertyDetails.brokerageName,
        brokerPhoneNumber: propertyDetails?.attributionInfo?.brokerPhoneNumber,
        buyerAgentMemberStateLicense:
            propertyDetails?.attributionInfo?.buyerAgentMemberStateLicense,
        buyerAgentName: propertyDetails?.attributionInfo?.buyerAgentName,
        buyerBrokerageName: propertyDetails?.attributionInfo?.buyerBrokerageName,
        coAgentLicenseNumber:
            propertyDetails?.attributionInfo?.coAgentLicenseNumber,
        coAgentName: propertyDetails?.attributionInfo?.coAgentName,
        priceHistory: propertyDetails?.priceHistory.map((price) => ({
            date: price.date,
            time: price.time,
            price: price.price,
            pricePerSquareFoot: price.pricePerSquareFoot,
            priceChangeRate: price.priceChangeRate,
            event: price.event,
            buyerAgent: price.buyerAgent,
            sellerAgent: price.sellerAgent
        })),
        description: propertyDetails?.description,
        timeOnZillow: propertyDetails?.timeOnZillow,
        pageViewCount: propertyDetails?.pageViewCount,
        favoriteCount: propertyDetails?.favoriteCount,
        daysOnZillow: propertyDetails?.daysOnZillow,
        latitude: propertyDetails?.latitude,
        longitude: propertyDetails?.longitude,
        monthlyHoaFee: propertyDetails?.monthlyHoaFee,
        lotSize: propertyDetails?.lotSize,
        lotAreaValue: propertyDetails?.lotAreaValue,
        lotAreaUnits: propertyDetails?.lotAreaUnits,
    };
}

const ErrorDiv = ({ hasError }) => {
    return hasError ? <Alert severity="error">
        <div>Error getting property details (fixing)</div>
        <div>But if it did work, here is an example data dump from test data</div>
    </Alert>

        : "";
}

const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

const calcAcre = (num, unit) => {
    return convertStrToAcre(unit)
}

const calcPpa = (price, acre) => {
    if (!isNaN(price && acre))
        return (acre === 0) ? "$0" : `${USDollar.format((price / acre).toFixed(0))}`
    else
        return (price && acre)
    return 0;
}
const calcDom = (history) => {
    // if the first item is "listed for sale, then seconds from now to them"
    if (history.length === 0)
        return 0

    const epochNow = Date.now()
    let aryOfMs = []

    let firstEventListed = false;
    const firstEvent = history[0].event.toLowerCase()
    if (firstEvent === "listed for sale") {
        const firstEventTime = history[0].time
        aryOfMs = [(epochNow - firstEventTime)]
        firstEventListed = true
    }

    let startHit = false;
    // let endHit = false;
    let startValue;
    let endValue;
    for (let i = (firstEventListed ? 1 : 0); i < history.length; i++) {
        // Find start time
        if (["listing removed", "sold"].includes(history[i].event.toString().toLowerCase())) {
            startHit = true;
            startValue = history[i].time;
        }
        if (history[i].event.toString().toLowerCase() === "listed for sale") {

            if (startHit) {
                endValue = history[i].time;
                aryOfMs = [...aryOfMs, (startValue - endValue)];
                startHit = false;
            }
        }
    }

    //console.log({ aryOfMs })

    const totalMs = aryOfMs.reduce((a, b) => a + b, 0)
    return Math.round(totalMs / 86400000);
}

const getGoogleMapsUrl = address => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

const DataTable = ({ details }) => {
    const [showPriceDetails, setShowPriceDetails] = useState(false);

    const handlePriceDetailsClick = () => {
        // Close details
        //setExpanded(false);
        setShowPriceDetails(!showPriceDetails);
    }

    const thisAcre = calcAcre(details.lotAreaValue, details.lotAreaString)
    const word = details.statusText.toLowerCase().replace("_", " ")
    const statusText = word.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
    const fields = {
        "price": USDollar.format(details.price),
        "acres": `${thisAcre} acres`,
        "price/acre": calcPpa(details.price, thisAcre),
        "status": statusText,
        "dom": calcDom(details.priceHistory),
        "views": details.pageViewCount,
        "favorites": details.favoriteCount,
        "saves": "N/A"
    }


    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell sx={{ width: 70 }} variant="header">
                    </TableCell>
                    {Object.keys(fields).map(field => (
                        <TableCell key={field} component="th" variant="header">
                            <Typography variant="caption">
                                <strong>{field.toUpperCase()}</strong>
                            </Typography>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                    <TableCell sx={{ width: "70" }}>
                        <IconButton onClick={handlePriceDetailsClick}>
                            <FontAwesomeIcon icon={icon({ name: 'dollar-sign' })} size="xs" />
                        </IconButton>
                    </TableCell>
                    {Object.keys(fields).map(field => (
                        <TableCell key={field}>
                            <Typography variant="caption">
                                {fields[field]}
                            </Typography>
                        </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                    <TableCell colSpan={1 + Object.keys(fields).length}>
                        <Collapse in={showPriceDetails} timeout="auto" unmountOnExit>
                            <PriceHistory history={details["priceHistory"]} />
                        </Collapse>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

export const DetailsView = ({ listings, details: theDetails, onClose }) => {
    const [expanded, setExpanded] = useState(false);
    const [showPriceDetails, setShowPriceDetails] = useState(false);


    const handleExpandClick = () => {
        // Close price
        setShowPriceDetails(false);
        setExpanded(!expanded);
    };

    const handlePriceDetailsClick = () => {
        // Close details
        setExpanded(false);
        setShowPriceDetails(!showPriceDetails);
    }

    let localDetails = theDetails
    let hasError = false;

    if ((Object.keys(theDetails).length === 0) || theDetails.errors) {
        localDetails = testDetails;
        hasError = true
    }
    const property = getRelaventData(listings, localDetails, hasError)
    const imgWidth = modalStyle.width - 100;
    //console.log({ property })
    return (
        <>
            <ErrorDiv hasError={hasError} />
            <Card>
                <CardHeader
                    avatar={
                        <Avatar sx={{ bgcolor: "#1277e1" }} aria-label="recipe">
                            <Button
                                aria-label={`info about ${property.address}`}
                                href={property["detailUrl"]} rel="noreferrer" target="_blank"
                                variant="link"
                            >
                                <ThirdPartyIcon site="zillow" />
                            </Button>
                        </Avatar>
                    }
                    action={
                        <IconButton onClick={() => onClose()}>
                            <FontAwesomeIcon icon={icon({ name: 'close' })} size="lg" />
                        </IconButton>
                    }
                    title={<strong>{property["unformattedPrice"]}</strong>}
                    subheader={property["address"]}
                />
                <CardMedia
                    component="img"
                    width={imgWidth}
                    image={property["image"]?.toString()}
                    loading="lazy"
                    alt={property.zpid}
                />
                <CardContent>
                    <DataTable details={property} />
                    <Typography variant="body2" color="text.secondary">
                        {property["description"]}
                    </Typography>
                </CardContent>
                <CardActions disableSpacing>
                    <Button
                        aria-label={`info about ${property.address}`}
                        href={property["detailUrl"]} rel="noreferrer" target="_blank"
                    //variant="link"
                    >
                        Zillow Link
                    </Button>
                    <Button
                        aria-label={`directions to ${property.address}`}
                        href={getGoogleMapsUrl(property.address)} rel="noreferrer" target="_blank"
                    //variant="link"
                    >
                        Google Maps
                    </Button>
                    <Button
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label="show more"
                        sx={{ marginLeft: 'auto' }}
                    >
                        {expanded ? <div>Less Info...</div> : <div>More Info...</div>}
                    </Button>
                </CardActions>
                <Collapse in={showPriceDetails} timeout="auto" unmountOnExit>
                    <PriceHistory history={property["priceHistory"]} />
                </Collapse>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <CardContent>
                        <Divider />
                        {Object.keys(property).map(k => {
                            switch (k.toString()) {
                                case "priceHistory":
                                case "description":
                                case "image":
                                case "detailUrl":
                                case "unformattedPrice":
                                    break;
                                default: return (
                                    <div key={k.toString()}>
                                        <strong>{k.toString()}</strong>: {property[k]?.toString()}
                                    </div>
                                )
                            }
                        })}
                    </CardContent>
                </Collapse>
            </Card>
        </>

    )
}