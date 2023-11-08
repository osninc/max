import { Box, Chip, Dialog, DialogContent, DialogContentText, DialogTitle, IconButton, Slide, TableCell, TableRow, Typography } from "@mui/material"
import netr from "../data/normalNetronline.json"
import InfoIcon from '@mui/icons-material/Info';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { forwardRef, useState } from "react";
import { defaultTheme } from "../constants/theme.js";

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
            headerClassName: 'netr--header',
            headerName: 'Name',
            width: 300,
        },
        {
            field: 'phone',
            headerClassName: 'netr--header',
            headerName: 'Phone',
            width: 150,
        },
        {
            field: 'onlineUrl',
            headerClassName: 'netr--header',
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

    function CustomToolbar() {
        return (
            <GridToolbarContainer>
                <Typography variant="h6" align="center" width={"100%"} marginBlock><strong>{county} Information</strong></Typography>
            </GridToolbarContainer>
        );
    }

    return (
        // <>
        //     <Chip
        //         variant="outlined"
        //         color="primary"
        //         size="small"
        //         icon={<InfoIcon />}
        //         label={`${county} Netr Information`}
        //         onClick={handleClickOpen}
        //     />
        //     <Dialog
        //         open={open}
        //         TransitionComponent={Transition}
        //         keepMounted
        //         onClose={handleClose}
        //         aria-describedby="alert-dialog-slide-description"
        //     >
        //         <DialogTitle>{county} Netr Information</DialogTitle>
        //         <DialogContent>
        //             <DialogContentText id="alert-dialog-slide-description">
        <Box sx={{ 
            width: 560, 
            border: "1px solid black",
            '& .netr--header': {
                backgroundColor: `${defaultTheme.palette.primary.main} !important`,
            }, }}>
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
                slots={{ toolbar: CustomToolbar }}
            />
        </Box>
        //             </DialogContentText>
        //         </DialogContent>
        //     </Dialog>
        // </>
    )
}