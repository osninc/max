import { Button, IconButton, ImageList, ImageListItem, ImageListItemBar, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { ThirdPartyIcon } from "./ThirdPartyIcon";
import { srcset } from "../constants/constants";
import { DataGrid } from '@mui/x-data-grid';
import { USDollar } from "../functions/functions.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { useState } from "react";

const getGoogleMapsUrl = address => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

const Images = ({ listings, onClick }) => {
    return (
        <ImageList sx={{

            height: 450,
        }} rowHeight={200}
            gap={8}
            cols={4}>
            {listings.map((item) => (
                <ImageListItem key={item.zpid} cols={1} rows={1}>
                    <img
                        {...srcset(item.image, 250, 200, 1, 1)}
                        src={(item.imgSrc.includes("googleapis.com")) ? "/no-image.png" : item.imgSrc}
                        alt={item.zpid}
                        loading="lazy"
                        onClick={() => onClick(item.zpid)}
                    />

                    <ImageListItemBar
                        title={item.price}
                        subtitle={`${item.streetAddress}, ${item.city}, ${item.state} ${item.zipcode}`}
                        actionIcon={
                            <Button
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                aria-label={`info about ${item.title}`}
                                href={`https://www.zillow.com/homedetails/${item.zpid}_zpid`} rel="noreferrer" target="_blank"
                            >

                                <ThirdPartyIcon site="zillow" />
                            </Button>
                        }
                    />
                </ImageListItem>
            ))}
        </ImageList>
    )

}

const Grid = ({ listings, onClick }) => {
    const columns = [
        {
            field: 'price',
            headerName: 'PRICE',
            valueGetter: (params) => USDollar.format(params.row.unformattedPrice)
        },
        {
            field: 'acres',
            headerName: 'ACRES',

            valueGetter: (params) =>  `${params.row.acre} acres`
        },
        {
            field: "ppa",
            headerName: "PRICE/ACRE",
            valueGetter: (params) => USDollar.format(params.row.unformattedPpa)
        },
        {
            field: "statusType", headerName: "STATUS", valueGetter: (params) => {
                const word = params.row.statusType.toLowerCase().replace("_", " ")
                return word.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
            }
        },
        { field: "dom", headerName: "DOM", valueGetter: () => "N/A" },
        { field: "views", headerName: "VIEWS", valueGetter: () => "N/A" },
        { field: "favorites", headerName: "FAVORITES", valueGetter: () => "N/A" },
        { field: "saves", headerName: "SAVE", valueGetter: () => "N/A" },
        {
            field: "zlink",
            headerName: "ZILLOW LINK", valueGetter: (params) => {
                return `https://www.zillow.com/homes/${params.row.zpid}_zpid`;
            },
            renderCell: ({ value }) => {
                return (
                    <IconButton
                        href={value} rel="noreferrer" target="_blank"
                        style={{ color: "#1277e1" }}
                    >
                        <FontAwesomeIcon icon={icon({ name: 'z' })} size="xs" />
                    </IconButton>
                )
            }
        },
        {
            field: "gmaps",
            headerName: "GOOGLE MAPS", valueGetter: (params) => {
                const address = `${params.row.streetAddress} ${params.row.city}, ${params.row.state} ${params.row.zipcode}`
                return getGoogleMapsUrl(address)
            },
            renderCell: ({ value }) => {
                return (
                    <IconButton
                        href={value} rel="noreferrer" target="_blank"
                        style={{ color: "#0F9D58" }}
                    >
                        <FontAwesomeIcon icon={icon({ name: 'location-dot' })} size="xs" />
                    </IconButton>
                )
            }
        },
        {
            field: "zpid", headerName: "DETAILS", renderCell: ({ value }) => {
                return (
                    <IconButton onClick={() => onClick(value)} color="primary">
                        <FontAwesomeIcon icon={icon({ name: 'circle-info' })} size="xs" />
                    </IconButton>
                )
            }
        }
    ];



    return (
        <DataGrid
            getRowId={(row) => row.zpid}
            rows={listings}
            columns={columns}
            initialState={{
                pagination: {
                    paginationModel: {
                        pageSize: 10,
                    },
                },
            }}
            pageSizeOptions={[5, 10, 15]}
            checkboxSelection
            disableRowSelectionOnClick
        />
    )
}

const ListingsView = ({ variant, listings, onDetailsClick }) => {
    const [viewAs, setViewAs] = useState(variant);
    return (
        <>
            <Typography variant="caption">
                View as:
            </Typography>
            <ToggleButtonGroup color="primary" value={viewAs} size="small" variant="text">
                <ToggleButton value="grid" onClick={() => setViewAs("grid")}>
                    <FontAwesomeIcon icon={icon({ name: 'table-cells' })} />
                </ToggleButton>,
                <ToggleButton value="image" onClick={() => setViewAs("image")}>
                    <FontAwesomeIcon icon={icon({ name: 'image' })} />
                </ToggleButton>,
            </ToggleButtonGroup>
            {(viewAs === "image") ? (
                <Images listings={listings} onClick={(zpid) => onDetailsClick(zpid)} />
            ) : (
                <Grid listings={listings} onClick={(zpid) => onDetailsClick(zpid)} />
            )}
        </>

    )

}

ListingsView.propTypes = {
    variant: PropTypes.string,
    listings: PropTypes.array.isRequired,
    onDetailsClick: PropTypes.func
};

ListingsView.defaultProps = {
    variant: "grid"
}

export default ListingsView;