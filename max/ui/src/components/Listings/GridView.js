import PropTypes from "prop-types";
import { IconButton, Popover, Typography } from "@mui/material";
import { USDollar, getGoogleMapsUrl, getZillowUrl } from "../../functions/functions";
import { ThirdPartyIcon } from "../ThirdPartyIcon";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import { DataGrid } from '@mui/x-data-grid';
import { SOURCE, srcset } from "../../constants/constants";
import { useState } from "react";

export const GridView = ({ listings, onClick }) => {
    const columns = [
        {
            field: 'price',
            headerName: 'PRICE',
            valueGetter: (params) => USDollar.format(params.row.unformattedPrice)
        },
        {
            field: 'acres',
            headerName: 'ACRES',

            valueGetter: (params) => `${params.row.acre} acres`
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
            headerName: "ZILLOW LINK", valueGetter: (params) => getZillowUrl(params.row.zpid),
            renderCell: ({ value }) => {
                return (
                    <IconButton
                        href={value} rel="noreferrer" target="_blank"
                        style={{ color: SOURCE.zillow.color }}
                    >
                        <ThirdPartyIcon site="zillow" size="xs" />
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
                        <FontAwesomeIcon icon={icon({ name: 'circle-info' })} size="sm" fixedWidth />
                    </IconButton>
                )
            }
        }
    ];

    const [anchorEl, setAnchorEl] = useState(null);
    const [value, setValue] = useState('');

    const handlePopoverOpen = (event) => {
        const id = event.currentTarget.parentElement.dataset.id;
        const row = listings.find(r => r.zpid === id);
        const field = event.currentTarget.dataset.field;

        const ignoreFields = ["zlink", "gmaps", "zpid", "__check__"]
        if (!ignoreFields.includes(field)) {
            setValue(row.imgSrc);
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);



    return (
        <>
            <DataGrid
                getRowId={(row) => row.zpid}
                rows={listings}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 15,
                        },
                    },
                }}
                pageSizeOptions={[5, 10, 15, 20]}
                checkboxSelection
                disableRowSelectionOnClick
                density='compact'
                slotProps={{
                    cell: {
                        onMouseEnter: handlePopoverOpen,
                        onMouseLeave: handlePopoverClose
                    },
                }}
            />
            <Popover
                sx={{
                    pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <img
                    {...srcset(value, 250, 200, 1, 1)}
                    src={value}
                    height={200}
                    loading="lazy"
                />
            </Popover>
        </>
    )
}
