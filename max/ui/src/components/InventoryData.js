import {
    Box,
    // Chip,
    CircularProgress,
    // Dialog,
    // DialogContent,
    // DialogContentText,
    // DialogTitle,
    Link,
    // Slide,
    Table,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { fetchInventory, findInventoryData } from '../api/apify';
//import InfoIcon from '@mui/icons-material/Info';
import { defaultTheme } from '../constants/theme.js';
import { USDollar, addLeadingZero, capitalizeFirstLetter, isOdd } from '../functions/functions.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';

// const Transition = forwardRef(function Transition(props, ref) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });

const fieldsToDisplay = [
    {
        show: true,
        field: 'month_date_yyyymm',
        fieldText: 'Date of Report mm/yyyy',
        render: (value) => {
            const year = value.slice(0, 4);
            const month = value.substr(value.length - 2);
            return `${month}/${year}`;
        },
    },
    {
        show: true,
        field: 'source_link',
        fieldText: 'Source Data',
        render: () => {
            return (
                <Link href="https://www.realtor.com/research/data/" rel="noreferrer" target="_blank">
                    <FontAwesomeIcon icon={icon({ name: 'link' })} fixedWidth />
                </Link>
            );
        },
    },
    {
        show: 'county',
        field: 'county_fips',
        fieldText: 'County FIPS',
    },
    {
        show: 'county',
        field: 'county_name',
        fieldText: 'County Name',
        render: (value) => {
            if (!value) return;
            const [county, state] = value.split(', ');
            return `${capitalizeFirstLetter(county)}, ${state.toUpperCase()}`;
        },
    },
    {
        show: 'zipcode',
        field: 'postal_code',
        fieldText: 'Postal Code',
        render: (value) => {
            if (value) return addLeadingZero(value, 5);
        },
    },
    {
        show: 'zipcode',
        field: 'zip_name',
        fieldText: 'City Name',
        render: (value) => {
            if (!value) return;
            const [county, state] = value.split(', ');
            return `${capitalizeFirstLetter(county)}, ${state.toUpperCase()}`;
        },
    },
    {
        show: 'state',
        field: 'state',
        fieldText: 'State',
    },
    {
        show: true,
        field: 'median_listing_price',
        fieldText: 'Median Listing Price',
        render: (value) => {
            return USDollar.format(value);
        },
    },
    {
        show: true,
        field: 'median_listing_price_mm',
        fieldText: 'Median Listing Price Change M/M',
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`;
        },
    },
    {
        show: true,
        field: 'median_listing_price_yy',
        fieldText: 'Median Listing Price Change Y/Y',
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`;
        },
    },
    {
        show: true,
        field: 'active_listing_count',
        fieldText: 'Active Listing Count',
    },
    {
        show: true,
        field: 'active_listing_count_mm',
        fieldText: 'Active Listing Count M/M',
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`;
        },
    },
    {
        show: true,
        field: 'active_listing_count_yy',
        fieldText: 'Active Listing Count Y/Y',
        render: (value) => {
            return `${(parseFloat(value) * 100).toFixed(2)}%`;
        },
    },
    {
        show: true,
        field: 'median_days_on_market',
        fieldText: 'Median Days On Market',
    },
];

const DisplayRow = (props) => {
    const { data, field, index } = props;

    const { field: key, fieldText: headerText, render: renderValue } = field;

    const renderedCell = renderValue ? renderValue(data[key]) : data[key];

    const sx = isOdd(index) ? {} : { backgroundColor: defaultTheme.palette.primary.light };

    return (
        <TableRow sx={sx}>
            <TableCell>{headerText}</TableCell>
            <TableCell>{renderedCell}</TableCell>
        </TableRow>
    );
};

DisplayRow.propTypes = {
    data: PropTypes.string,
    field: PropTypes.string,
    index: PropTypes.number,
};

export const InventoryData = (props) => {
    const { searchType, area } = props;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const returnData = await fetchInventory(searchType, area);
            const data2 = await findInventoryData(returnData, searchType, area);
            setLoading(false);
            if (data2 !== null) setData(data2);
        };
        fetchData();
    }, [area]);

    return loading ? (
        [
            <CircularProgress key={0} size={20} value="Loading" />,
            <Typography key={1} variant="caption">
                Loading Inventory Data...
            </Typography>,
        ]
    ) : (
        <Box
            sx={{
                width: 560,
                border: '1px solid black',
                '& .netr--header': {
                    backgroundColor: defaultTheme.palette.primary.main,
                },
            }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2}>
                            <Typography variant="h6" align="center" width={'100%'} marginBlock>
                                <strong>Realtor.com Monthly Housing Market Data</strong>
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                {data === null ? (
                    <TableRow>
                        <TableCell colSpan={2} align="center">
                            <Typography variant="caption">No information available for {area}</Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    fieldsToDisplay
                        .filter((field) => field.show === true || field.show.toLowerCase() === searchType.toLowerCase())
                        .map((field2, i) => <DisplayRow field={field2} data={data} key={field2.field} index={i} />)
                )}
            </Table>
        </Box>
    );
};

InventoryData.propTypes = {
    searchType: PropTypes.string,
    area: PropTypes.string,
};
