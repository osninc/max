import {
    Box,
    // Chip,
    // CircularProgress,
    // Dialog,
    // DialogContent,
    // DialogContentText,
    // DialogTitle,
    IconButton,
    //Slide,
    // TableCell,
    // TableRow,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import netr from '../data/normalNetronline.json';
//import InfoIcon from '@mui/icons-material/Info';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';
//import { forwardRef, } from 'react';
import { defaultTheme } from '../constants/theme.js';
//import { fetchInventory, findInventoryData } from '../api/apify.js';
//import { capitalizeFirstLetter } from '../functions/functions.js';
import zipCounty from '../data/zip_county.json';

// const Transition = forwardRef(function Transition(props, ref) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });

export const Netronline = ({ searchType, area }) => {
    // const [loading, setLoading] = useState(false)
    // const [data, setData] = useState([])
    // const [county, setCounty] = useState('')

    // // If its zipcode, lookup county
    // useEffect(() => {
    //     if (searchType.toLowerCase() === 'zipcode') {
    //         const fetchData = async () => {
    //             const returnData = await fetchInventory(searchType, area)
    //             const data2 = await findInventoryData(returnData, searchType, area)
    //             setLoading(false)
    //             if (data2 !== null) {
    //                 setData(data2)
    //                 const [county1, state1] = data2.zip_name.split(', ')
    //                 const zipName = `${capitalizeFirstLetter(county1)}, ${state1.toUpperCase()}`
    //                 setCounty(zipName)
    //                 console.log({data2})
    //                 console.log({ zipName })
    //             }
    //         }
    //         fetchData()
    //     }
    //     else {
    //         setLoading(false)
    //         setData([])
    //         setCounty(area)
    //     }
    // }, [area])

    if (['state'].includes(searchType.toLowerCase())) return '';

    let county = area;
    if (searchType.toLowerCase() === 'zipcode') county = zipCounty[area];

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
                return (
                    <IconButton href={value} rel="noreferrer" target="_blank" style={{ color: '#0F9D58' }}>
                        <FontAwesomeIcon icon={icon({ name: 'link' })} size="xs" fixedWidth />
                    </IconButton>
                );
            },
        },
    ];

    function CustomToolbar() {
        return (
            <GridToolbarContainer>
                <Typography variant="h6" align="center" width={'100%'} marginBlock>
                    <strong>{county} Contact Info</strong>
                </Typography>
            </GridToolbarContainer>
        );
    }

    return (
        // loading && (data === null) ? [<CircularProgress key={0} size={20} value='Loading' />, <Typography key={1} variant='caption'>Loading County Data...</Typography>] : (
        <Box
            sx={{
                width: 560,
                border: '1px solid black',
                '& .netr--header': {
                    backgroundColor: `${defaultTheme.palette.primary.main} !important`,
                },
            }}
        >
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
                density="compact"
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                slots={{ toolbar: CustomToolbar }}
            />
        </Box>
        //)
    );
};

Netronline.propTypes = {
    searchType: PropTypes.string,
    area: PropTypes.string,
};
