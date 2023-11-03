import PropTypes from "prop-types";
import { Card, CardContent, CardMedia, IconButton, Paper, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { USDollar, getGoogleMapsUrl, getRealtorUrl } from "../../functions/functions";
import { ThirdPartyIcon } from "../ThirdPartyIcon";
import { darken, lighten, styled } from '@mui/material/styles';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

import { DataGrid } from '@mui/x-data-grid';
import { SOURCE } from "../../constants/constants";
import { useState } from "react";
import LinkPreview from "../LinkPreview";
import { defaultTheme } from "../../constants/theme";
import Iframe from 'react-iframe'
import { NotAvailable } from "../NotAvailable";

export const GridView = ({ source, listings, onClick }) => {
    const detailsColumn = {
        field: "zpid", headerName: "DETAILS", renderCell: ({ value }) => {
            return (
                <IconButton onClick={() => onClick(value)} color="primary">
                    <FontAwesomeIcon icon={icon({ name: 'circle-info' })} size="sm" fixedWidth />
                </IconButton>
            )
        }
    }
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
        {
            field: "dom", headerName: "DOM", renderCell: ({ row }) => {
                if (!row.dom) {
                    return <NotAvailable />;
                }
                return row.dom;
            }
        },
        {
            field: "views", headerName: "VIEWS", renderCell: ({ row }) => {
                if (!row.views) {
                    return <NotAvailable />;
                }
                return row.views;
            }
        },
        {
            field: "favorites", headerName: "FAVORITES", renderCell: ({ row }) => {
                if (!row.favorites) {
                    return <NotAvailable />;
                }
                return row.favorites;
            }
        },
        {
            field: "saves", headerName: "SAVES", renderCell: ({ row }) => {
                if (!row.saves) {
                    return <NotAvailable />;
                }
                return row.saves;
            }
        },
        {
            field: `${source}_link`,
            headerName: `${source.toUpperCase()} LINK`, valueGetter: (params) => getRealtorUrl(source, params.row.zpid, params.row.url),
            renderCell: ({ value }) => {
                return (
                    <IconButton
                        href={value} rel="noreferrer" target="_blank"
                        style={{ color: SOURCE[source].color }}
                    >
                        <ThirdPartyIcon site={source} size="xs" />
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
        }
    ];

    const [anchorEl, setAnchorEl] = useState(null);
    const [value, setValue] = useState('');
    const [field, setField] = useState("")

    const handlePopoverOpen = (event) => {
        const id = event.currentTarget.parentElement.dataset.id;
        const row = listings.find(r => r.zpid.toString() === id.toString());
        const field = event.currentTarget.dataset.field;

        const ignoreFields = ["redfin_link", "zillow_link", "gmaps", "zpid", "__check__"]
        if (!ignoreFields.includes(field)) {
            setValue(row);
            setAnchorEl(event.currentTarget);
            setField(field)
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const showColumns = [
        ...columns,
        ((source !== "redfin") && detailsColumn)
    ]

    return (
        <>
            <DataGrid
                getRowId={(row) => row.zpid}
                rows={listings}
                columns={showColumns}
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
                sx={{
                    "& .MuiDataGrid-row:hover": {
                        backgroundColor: defaultTheme.palette.primary.light
                        // color: "red"
                    }
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
                {(field === "zlink") ? (
                    <Iframe url={getRealtorUrl(source, value.zpid)}
                        width="300px"
                        height="200px"
                        id=""
                        className=""
                        display="block"
                        position="relative"
                        referrerpolicy="no-referrer"
                        loading="lazy"
                        sandbox={["allow-same-origin"]}
                    />
                    // <LinkPreview url={getZillowUrl(value.zpid)} />
                ) : (
                    <Card sx={{ maxWidth: 245, minWidth: 245 }}>
                        <CardMedia
                            sx={{ maxHeight: 200, height: 175 }}
                            image={value.imgSrc}
                            title="property"
                        />
                        <CardContent>
                            <Table density="dense" size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" padding="none" variant="header">Price</TableCell>
                                        <TableCell align="center" padding="none" variant="header">Acres</TableCell>
                                        <TableCell align="center" padding="none" variant="header">Price/Acre</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell align="center" padding="none">{value.price}</TableCell>
                                        <TableCell align="center" padding="none">{value.acre}</TableCell>
                                        <TableCell align="center" padding="none">{USDollar.format(value.unformattedPpa)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

            </Popover >
        </>
    )
}
