import { Chip, Dialog, DialogContent, DialogContentText, DialogTitle, IconButton, Slide, TableCell, TableRow } from "@mui/material"
import netr from "../data/normalNetronline.json"
import InfoIcon from '@mui/icons-material/Info';
import { DataGrid } from '@mui/x-data-grid';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { forwardRef, useState } from "react";

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const Netronline = ({ county }) => {
    const [open, setOpen] = useState(false);


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const countyData = netr[county];
    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            width: 300,
        },
        {
            field: 'phone',
            headerName: 'Phone',
            width: 150,
        },
        {
            field: 'onlineUrl',
            headerName: 'Website',
            width: 110,
            renderCell: ({ value }) => {
                return (<IconButton
                    href={value} rel="noreferrer" target="_blank"
                    style={{ color: "#0F9D58" }}
                >
                    <FontAwesomeIcon icon={icon({ name: 'link' })} size="xs" />
                </IconButton>
                )
            }
        }
    ]

    return (
        <>
            <Chip
                variant="outlined"
                color="primary"
                size="small"
                icon={<InfoIcon />}
                label={`${county} Netr Information`}
                onClick={handleClickOpen}
            />
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{county} Netr Information</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        <DataGrid
                            getRowId={(row) => row.name}
                            rows={countyData}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                    },
                                },
                            }}
                            density='compact'
                            pageSizeOptions={[5]}
                            disableRowSelectionOnClick
                        />
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </>
    )
}