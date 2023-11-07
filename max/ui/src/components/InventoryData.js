import { Chip, CircularProgress, Dialog, DialogContent, DialogContentText, DialogTitle, Slide, Table, TableCell, TableRow, Typography } from "@mui/material"
import { useEffect, useState, forwardRef } from "react"
import { fetchInventory } from "../api/apify"
import InfoIcon from '@mui/icons-material/Info';

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});


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
            const theData = jsonData.filter(entry => (entry[field] === compareValue))
            return (theData.length > 0) ? theData[0] : null
        }
        else
            return null
    }

    useEffect(() => {
        //if (data === null) {
            const fetchData = async () => {
                const returnData = await fetchInventory(searchType, area)
                const data = await findData(returnData)
                setLoading(false)
                setData(data)
            }
            fetchData()
       // }
    }, [data])

    const [open, setOpen] = useState(false);


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        loading ? [<CircularProgress key={0} size={20} value="Loading" />, <Typography variant="caption">Loading Inventory Data...</Typography>] : (
            <>
                <Chip
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon={<InfoIcon />}
                    label={`${area} Inventory Data`}
                    onClick={handleClickOpen}
                />
                <Dialog
                    open={open}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={handleClose}
                    aria-describedby="alert-dialog-slide-description"
                >
                    <DialogTitle>{area} Inventory Data</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            <Table>
                                {Object.keys(data).map(key => (
                                    <TableRow key={key}>
                                        <TableCell>{key}</TableCell>
                                        <TableCell>{data[key]}</TableCell>
                                    </TableRow>
                                ))}
                            </Table>

                        </DialogContentText>
                    </DialogContent>
                </Dialog>
            </>
        )
    )
}