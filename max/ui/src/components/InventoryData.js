import { Box, Chip, CircularProgress, Dialog, DialogContent, DialogContentText, DialogTitle, Slide, Table, TableCell, TableHead, TableRow, Typography } from "@mui/material"
import { useEffect, useState, forwardRef } from "react"
import { fetchInventory } from "../api/apify"
import InfoIcon from '@mui/icons-material/Info';
import { defaultTheme } from "../constants/theme.js";
import { USDollar, capitalizeFirstLetter, isOdd } from "../functions/functions.js";

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const fieldsToDisplay = [
    {
        show: true,
        field: "month_date_yyyymm",
        fieldText: "Date of Report mm/yyyy",
        render: (value) => {
            const year = value.slice(0, 4)
            const month = value.substr(value.length - 2)
            return `${month}/${year}`
        }
    },
    {
        show: "county",
        field: "county_fips",
        fieldText: "County FIPS"
    },
    {
        show: "county",
        field: "county_name",
        fieldText: "County Name",
        render: (value) => {
            if (!value) return
            const [county, state] = value.split(", ")
            return `${capitalizeFirstLetter(county)}, ${state.toUpperCase()}`
        }
    },
    {
        show: "zipcode",
        field: "postal_code",
        fieldText: "Postal Code"
    },
    {
        show: "zipcode",
        field: "zip_name",
        fieldText: "City Name",
        render: (value) => {
            if (!value) return
            const [county, state] = value.split(", ")
            return `${capitalizeFirstLetter(county)}, ${state.toUpperCase()}`
        }
    },
    {
        show: "state",
        field: "state",
        fieldText: "State"
    },
    {
        show: true,
        field: "median_listing_price",
        fieldText: "Median Listing Price",
        render: (value) => {
            return USDollar.format(value)
        }
    },
    {
        show: true,
        field: "median_listing_price_mm",
        fieldText: "Median Listing Price Change M/M",
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`
        }
    },
    {
        show: true,
        field: "median_listing_price_yy",
        fieldText: "Median Listing Price Change Y/Y",
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`
        }
    },
    {
        show: true,
        field: "active_listing_count",
        fieldText: "Active Listing Count"
    },
    {
        show: true,
        field: "active_listing_count_mm",
        fieldText: "Active Listing Count M/M",
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`
        }
    },
    {
        show: true,
        field: "active_listing_count_yy",
        fieldText: "Active Listing Count Y/Y",
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`
        }
    },
    {
        show: true,
        field: "median_days_on_market",
        fieldText: "Median Days On Market"
    }
]

const DisplayRow = props => {
    const {
        data,
        field,
        index
    } = props

    const {
        field: key,
        fieldText: headerText,
        render: renderValue
    } = field

    const renderedCell = renderValue ? renderValue(data[key]) : data[key]

    const sx = isOdd(index) ? {} : { backgroundColor: defaultTheme.palette.primary.light }

    return (
        <TableRow sx={sx}>
            <TableCell>{headerText}</TableCell>
            <TableCell>{renderedCell}</TableCell>
        </TableRow>
    )
}

export const InventoryData = props => {
    const {
        searchType,
        area
    } = props
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)

    const findData = async (data) => {
        const transformSearchType = (searchType.toLowerCase() === "zipcode") ? "zip" : searchType.toLowerCase()
        const entry = data.filter(e => e.geoType && (e.geoType.toLowerCase() === transformSearchType))
        const json = (entry.length > 0) ? entry[0].jsonUrl : ""
        if (json !== "") {
            const api_call = await fetch(json);
            const jsonData = await api_call.json();
            let field = ""
            let compareValue = area.toLowerCase()
            switch (transformSearchType) {
                case "county":
                    field = "county_name"
                    compareValue = compareValue.replace(" county", "")
                    break;
                case "zip":
                    field = "postal_code"
                    break;
                case "state":
                    field = "state_id"
                    break;
                default:
                    break
            }
            const theData = jsonData.filter(entry => (entry[field].toLowerCase() === compareValue.toLowerCase()))
            return (theData.length > 0) ? theData[0] : null
        }
        else
            return null
    }

    useEffect(() => {
        //if (data === null) {
            const fetchData = async () => {
                const returnData = await fetchInventory(searchType, area)
                const data2 = await findData(returnData)
                setLoading(false)
                setData(data2)
            }
            fetchData()
        //}
    }, [area])

    // const [open, setOpen] = useState(false);


    // const handleClickOpen = () => {
    //     setOpen(true);
    // };

    // const handleClose = () => {
    //     setOpen(false);
    // };

    //console.log({data})

    return (
        loading ? [<CircularProgress key={0} size={20} value="Loading" />, <Typography variant="caption">Loading Inventory Data...</Typography>] : (
            // <>
            //     <Chip
            //         variant="outlined"
            //         color="primary"
            //         size="small"
            //         icon={<InfoIcon />}
            //         label={`${area} Inventory Data`}
            //         onClick={handleClickOpen}
            //     />
            //     <Dialog
            //         open={open}
            //         TransitionComponent={Transition}
            //         keepMounted
            //         onClose={handleClose}
            //         aria-describedby="alert-dialog-slide-description"
            //     >
            //         <DialogTitle>{area} Inventory Data</DialogTitle>
            //         <DialogContent>
            //             <DialogContentText id="alert-dialog-slide-description">
            <Box sx={{
                width: 560,
                border: "1px solid black",
                '& .netr--header': {
                    backgroundColor: defaultTheme.palette.primary.main,
                },
            }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6" align="center" width={"100%"} marginBlock><strong>Realtor.com Monthly Market Data</strong></Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {fieldsToDisplay.filter(field => ((field.show === true) || (field.show.toLowerCase() === searchType.toLowerCase()))).map((field, i) => (
                        <DisplayRow field={field} data={data} key={field.field} index={i} />
                    ))}
                </Table>
            </Box>
            //             </DialogContentText>
            //         </DialogContent>
            //     </Dialog>
            // </>
        )
    )
}