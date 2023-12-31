import {
    Button,
    ButtonGroup,
    CircularProgress,
    Paper,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { matrix } from '../../constants/matrix.js';
import { ThirdPartyIcon } from '../ThirdPartyIcon.js';
import { DisplayNumber, USDollar, convertDateToLocal, sec2min } from '../../functions/functions.js';
import { ACTORS } from '../../constants/constants.js';
import { ComingSoon } from './components/ComingSoon.js';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import HelpIcon from '@mui/icons-material/Help';

const columnColor = {
    sold: 'white',
    'for sale': 'white',
};

const BigDataTableHeader = (props) => {
    const { bg, columns } = props;

    return (
        <>
            {[...Array(columns.cols)].map((_, i) => {
                return (
                    <TableCell key={i} colSpan={columns.colspan} sx={{ backgroundColor: bg[i] }} align="center">
                        {columns.colText[i]}
                    </TableCell>
                );
            })}
        </>
    );
};

BigDataTableHeader.propTypes = {
    bg: PropTypes.array,
    columns: PropTypes.object,
};

const DataCell = (props) => {
    const cellElementSale = useRef();
    const cellElementSold = useRef();

    const { data: counts, lot, time, onClick, field, open, onMouseEnter, onMouseLeave, source } = props;
    const record = counts[lot][time];

    const calcDaysInTimeFrame = {
        '1 day': 1,
        '3 days': 3,
        '7 days': 7,
        '14 days': 14,
        '1 week': 7,
        '30 days': 30,
        '1 month': 30,
        '45 days': 45,
        '90 days': 90,
        '3 months': 180,
        '6 months': 180,
        '12 months': 360,
        '1 year': 360,
        '24 months': 720,
        '2 years': 720,
        '36 months': 1080,
        '3 years': 1080,
        '5 years': 1800,
        'last 1 month': 30,
        'last 1 week': 7,
        'last 1 year': 360,
        'last 2 years': 720,
        'last 3 months': 180,
        'last 3 years': 360 * 3,
        'last 5 years': 360 * 5,
        'last 6 months': 30 * 6,
        'less than 3 days': 3,
        'less than 7 days': 7,
        'less than 30 days': 30,
        'more than 7 days': 7,
        'more than 14 days': 14,
        'more than 30 days': 30,
        'more than 45 days': 45,
        'more than 90 days': 90,
        'more than 180 days': 180,
    };

    const typographyParams = {
        variant: 'body2',
    };

    if (['count', 'medianPrice', 'medianPpa', 'avgDom'].includes(field)) {
        const sold = record ? record['sold'] : null;
        const sale = record ? record['for sale'] : null;

        const lcLot = lot.toLowerCase();
        let commonParams = {
            time: matrix[source].time[time.toLowerCase()],
            lot: lcLot,
        };
        if (matrix[source].lot[lcLot].minLotSize !== '')
            commonParams = { ...commonParams, minLotSize: matrix[source].lot[lcLot].minLotSize.toString() };
        if (matrix[source].lot[lcLot].maxLotSize !== '')
            commonParams = { ...commonParams, maxLotSize: matrix[source].lot[lcLot].maxLotSize.toString() };

        const buttonGroupParams = {
            disableElevation: true,
            variant: 'text',
            size: 'small',
            sx: { minWidth: 10 },
        };

        // clicked params
        let soldParams;
        let soldHtml = 'N/A';
        let soldTextButton;
        let soldHover = '';
        let soldText = '';

        if (sold) {
            soldText = sold[field];
            soldParams = {
                ...commonParams,
                status: matrix[source].status['sold'],
                count: sold.count,
                mapCount: sold.mapCount,
            };
            switch (field) {
                case 'medianPrice':
                case 'medianPpa':
                    soldText = USDollar.format(soldText);
                    soldTextButton = (
                        <Button href="#" onClick={(e) => onClick(e, soldParams, cellElementSold)}>
                            {soldText}
                        </Button>
                    );
                    break;
                case 'avgDom':
                    // Round up the days on market to full day
                    soldTextButton = (
                        <Button href="#" onClick={(e) => onClick(e, soldParams, cellElementSold)}>
                            {Math.ceil(parseFloat(soldText))}
                        </Button>
                    );
                    break;
                case 'count':
                    soldTextButton = (
                        <ButtonGroup {...buttonGroupParams}>
                            <Button
                                href="#"
                                onClick={(e) => onClick(e, soldParams, cellElementSold)}
                                sx={{ color: 'black' }}
                            >
                                <strong>{DisplayNumber.format(soldText)}</strong>
                            </Button>
                            <Button href={sold.url} rel="noreferrer" target="_blank">
                                <ThirdPartyIcon site={source} size="xs" />
                            </Button>
                        </ButtonGroup>
                    );
                    break;
                default:
                    soldTextButton = soldText;
                    break;
            }
            soldHtml = soldTextButton;
        }

        let saleParams;
        let saleHtml = 'N/A';
        let saleTextButton;
        let saleHover = '';
        let saleText = '';

        //console.log({sale})
        if (sale) {
            saleText = sale[field];
            saleParams = {
                ...commonParams,
                status: matrix[source].status['for sale'],
                count: sale.count,
                mapCount: sale.mapCount,
            };
            switch (field) {
                case 'medianPrice':
                case 'medianPpa':
                    saleText = USDollar.format(saleText);
                    saleTextButton = (
                        <Button href="#" onClick={(e) => onClick(e, saleParams, cellElementSale)}>
                            {saleText}
                        </Button>
                    );
                    break;
                case 'avgDom':
                    //saleText = saleText;
                    // Round up the days on market to full day
                    saleTextButton = (
                        <Button href="#" onClick={(e) => onClick(e, saleParams, cellElementSale)}>
                            {Math.ceil(parseFloat(saleText))}
                        </Button>
                    );
                    break;
                case 'count':
                    saleTextButton = (
                        <ButtonGroup {...buttonGroupParams}>
                            <Button href="#" onClick={(e) => onClick(e, saleParams, cellElementSale)}>
                                {DisplayNumber.format(saleText)}
                            </Button>
                            <Button href={sale.url} rel="noreferrer" target="_blank">
                                <ThirdPartyIcon site={source} size="xs" />
                            </Button>
                        </ButtonGroup>
                    );
                    break;
                default:
                    saleTextButton = saleText;
                    break;
            }
            saleHtml = saleTextButton;
        }

        let moreSaleText = '';
        let moreSoldText = '';
        if (ACTORS[source.toUpperCase()].SHOWDISCLAIMNER) {
            if (record['for sale'].numPrices >= 500)
                moreSaleText = (
                    <strong>
                        DISCLAIMER: Results are limited to 500 records
                        <br />
                    </strong>
                );
            if (record['sold'].numPrices >= 500)
                moreSoldText = (
                    <strong>
                        DISCLAIMER: Results are limited to 500 records
                        <br />
                    </strong>
                );
        }
        switch (field) {
            case 'medianPrice':
                saleHover = (
                    <Typography variant="caption">
                        {moreSaleText}
                        This value is the middle price of all {record['for sale'].numPrices} available price(s)
                    </Typography>
                );
                soldHover = (
                    <Typography variant="caption">
                        {moreSoldText}
                        This value is the middle price of all {record['sold'].numPrices} available price(s)
                    </Typography>
                );
                break;
            case 'medianPpa':
                saleHover = (
                    <Typography variant="caption">
                        {moreSaleText}
                        This value is the middle of all {record['for sale'].numPrices} listings&apos; individual price
                        per acre
                    </Typography>
                );
                soldHover = (
                    <Typography variant="caption">
                        {moreSoldText}
                        This value is the middle of all {record['sold'].numPrices} sales&apos; individual price per acre
                    </Typography>
                );
                break;
            case 'avgDom':
                saleHover = (
                    <Typography variant="caption">
                        {moreSaleText}
                        This value is the sum of each of the listing&apos;s Days On Market divided by (
                        {record['for sale'].domCount}) listings that had price history
                        <br />
                        sum(DOM) / {record['for sale'].domCount} = {saleText}
                        <br />
                        The value is rounded up to the full day.
                    </Typography>
                );
                soldHover = (
                    <Typography variant="caption">
                        {moreSoldText}
                        This value is the sum of each of the sale&apos;s Days On Market divided by (
                        {record['sold'].domCount}
                        ) sales that had price history
                        <br />
                        sum(DOM) / {record['sold'].domCount} = {soldText}
                        <br />
                        The value is rounded up to the full day.
                    </Typography>
                );
                break;
            default:
                break;
        }

        return (
            <React.Fragment key={`${lot}${time}`}>
                <TableCell align="center" sx={{ backgroundColor: columnColor['for sale'] }} ref={cellElementSale}>
                    {saleHover === '' ? (
                        saleHtml
                    ) : (
                        <Typography
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onMouseEnter={(e) => onMouseEnter(e, saleHover)}
                            onMouseLeave={(e) => onMouseLeave(e)}
                            {...typographyParams}
                        >
                            {saleHtml}
                        </Typography>
                    )}
                </TableCell>

                <TableCell align="center" sx={{ backgroundColor: columnColor['sold'] }} ref={cellElementSold}>
                    {soldHover === '' ? (
                        soldHtml
                    ) : (
                        <Typography
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onMouseEnter={(e) => onMouseEnter(e, soldHover)}
                            onMouseLeave={(e) => onMouseLeave(e)}
                            {...typographyParams}
                        >
                            {soldHtml}
                        </Typography>
                    )}
                </TableCell>
            </React.Fragment>
        );
    } else {
        // Possible hover
        let text = '';
        switch (field) {
            case 'mos':
                text = (
                    <Typography variant="caption">
                        This value was calculated by Number of Active Listings ({record['for sale']?.count}) divided by
                        Number of Sales ({record['sold']?.count}) multiplied by the number of days (
                        {calcDaysInTimeFrame[time.toLowerCase()]}) divided by 30 days
                        <br />
                        {record['for sale']?.count} / {record['sold']?.count} *{' '}
                        {calcDaysInTimeFrame[time.toLowerCase()]} / 30 = {record[field]}
                    </Typography>
                );
                break;
            case 'absorption':
                text = (
                    <Typography variant="caption">
                        This value is the percentage of the Number of Sales ({record['sold']?.count}) divided by Number
                        of Listings ({record['for sale']?.count})<br />
                        {record['sold']?.count} / {record['for sale']?.count} * 100% = {record[field]}
                    </Typography>
                );
                break;
            case 'ratio':
                text = (
                    <Typography variant="caption">
                        This value is the percentage of the Number of Listings ({record['for sale']?.count}) divided by
                        Number of Sales ({record['sold']?.count})<br />
                        {record['for sale']?.count} / {record['sold']?.count} * 100% = {record[field]}
                    </Typography>
                );
                break;
            default:
                break;
        }
        return (
            <TableCell align="center" colSpan={2} sx={{ backgroundColor: columnColor['for sale'] }}>
                {text === '' ? (
                    record[field]
                ) : (
                    <Typography
                        aria-owns={open ? 'mouse-over-popover' : undefined}
                        aria-haspopup="true"
                        onMouseEnter={(e) => onMouseEnter(e, text)}
                        onMouseLeave={(e) => onMouseLeave(e)}
                        {...typographyParams}
                    >
                        {record[field]}
                    </Typography>
                )}
            </TableCell>
        );
    }
};

DataCell.propTypes = {
    data: PropTypes.object,
    lot: PropTypes.string,
    time: PropTypes.string,
    onClick: PropTypes.func,
    field: PropTypes.string,
    open: PropTypes.bool,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    source: PropTypes.string,
};

export const BigDataTable = ({
    value,
    data,
    onClick,
    area,
    date,
    source,
    loadTime,
    onGetDetailsClick,
    detailsLoading,
}) => {
    const newDate = convertDateToLocal(date);
    const newLoadTime = loadTime > 0 ? `(${sec2min(loadTime)})` : '';
    const commonColText = [
        <Typography key={0} sx={{ color: '#505050' }} variant="body2">
            Listed
        </Typography>,
        <strong key={1}>Sold</strong>,
    ];
    const commonBgColor = ['white', 'white'];
    const commonHeaderParams = {
        color: '#626262',
        textColor: 'white',
    };
    const tableHeader = {
        0: {
            ...commonHeaderParams,
            text: 'Sales & Listing Counts',
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: 'count',
        },
        1: {
            text: 'Median Prices for Sold & Listed Land',
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: 'medianPrice',
        },
        2: {
            text: 'List/Sale Ratio',
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ['Ratio L/S'],
            },
            comingSoon: false,
            dataField: 'ratio',
        },
        3: {
            text: 'PPA: Price/Per Acre',
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: 'medianPpa',
        },
        4: {
            text: 'Months of Supply',
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ['MoS'],
            },
            comingSoon: false,
            dataField: 'mos',
        },
        5: {
            text: 'DOM Days on Market',
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: !data.meta.hasDetails,
            dataField: 'avgDom',
        },
        6: {
            text: 'Realtors',
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: !data.meta.hasDetails,
            dataField: 'count',
        },
        7: {
            text: 'Absorption Rate',
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ['Absorption'],
            },
            comingSoon: false,
            dataField: 'absorption',
        },
    };

    const colSpan = Object.keys(matrix[source].time).length * 2 + 3;

    // For hovering
    const [anchorEl, setAnchorEl] = useState(null);
    const [popoverText, setPopoverText] = useState('');
    const handlePopoverOpen = (event, text) => {
        setPopoverText(text);
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    // calculate columns loop
    const colLoop = [...Array(Object.keys(matrix[source].time).length)];

    // Calculate
    const filteredData = Object.keys(data)
        .filter((el) => el !== 'meta')
        .map((acreage) =>
            Object.keys(data[acreage]).map((time) => {
                const fsListings = data[acreage][time]['for sale'] ? data[acreage][time]['for sale'].listings : [];
                const soldListings = data[acreage][time]['sold'] ? data[acreage][time]['sold'].listings : [];

                const fsListingCount = data[acreage][time]['for sale']?.count ?? 0;
                const fsMapCount = data[acreage][time]['for sale']?.mapCount ?? 0;
                const soldListingCount = data[acreage][time]['sold']?.count ?? 0;
                const soldMapCount = data[acreage][time]['sold']?.mapCount ?? 0;

                return {
                    count: fsListingCount + soldListingCount,
                    mapCount: fsMapCount + soldMapCount,
                    listings: [...fsListings, ...soldListings],
                    fsListings: fsListings,
                    soldListings: soldListings,
                    forSale: fsListingCount,
                    sold: soldListingCount,
                };
            }),
        )
        .map((x) => {
            return {
                mapCount: x.filter((el) => el.mapCount !== 'N/A').reduce((a, b) => a + b.mapCount, 0),
                count: x.filter((el) => el.count !== 'N/A').reduce((a, b) => a + b.count, 0),
                listings: x.map((xx) => xx.listings),
                fsListings: x.map((xx) => xx.fsListings),
                soldListings: x.map((xx) => xx.soldListings),
                forSale: x.reduce((a, b) => a + b.forSale, 0),
                sold: x.reduce((a, b) => a + b.sold, 0),
            };
        });

    const firstFsFlat = filteredData.map((data) => data.fsListings.map((d) => d.map((e) => e.zpid))).flat(1);
    const secondFsFlat = firstFsFlat.filter((el) => el).flat(1);
    const uniqueFs = secondFsFlat.filter((value, index, array) => array.indexOf(value) === index);

    const firstSoldFlat = filteredData.map((data) => data.soldListings.map((d) => d.map((e) => e.zpid))).flat(1);
    const secondSoldFlat = firstSoldFlat.filter((el) => el).flat(1);
    const uniqueSold = secondSoldFlat.filter((value, index, array) => array.indexOf(value) === index);

    const firstAllFlat = filteredData.map((data) => data.listings.map((d) => d.map((e) => e.zpid))).flat(1);
    const secondAllFlat = firstAllFlat.filter((el) => el).flat(1);
    const uniqueAll = secondAllFlat.filter((value, index, array) => array.indexOf(value) === index);

    const counts = {
        mapCount: filteredData.filter((el) => el.mapCount !== 'N/A').reduce((a, b) => a + b.mapCount, 0),
        count: filteredData.filter((el) => el.count !== 'N/A').reduce((a, b) => a + b.count, 0),
        unique: uniqueAll.length,
        uniqueFs: uniqueFs.length,
        uniqueSold: uniqueSold.length,
        forSale: filteredData.reduce((a, b) => a + b.forSale, 0),
        sold: filteredData.reduce((a, b) => a + b.sold, 0),
    };

    // Handle help icon popover
    const [anchorHelpEl, setAnchorHelpEl] = useState(null);

    const handleHelpPopoverOpen = (event) => {
        setAnchorHelpEl(event.currentTarget);
    };

    const handleHelpPopoverClose = () => {
        setAnchorHelpEl(null);
    };

    const openHelp = Boolean(anchorHelpEl);

    return value === 6 || !['zillow', 'redfin'].includes(source) ? (
        <ComingSoon area={area} header={tableHeader[value]} date={newDate} />
    ) : (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="simple table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#dddddd' }}>
                        {/* <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell> */}
                        <TableCell colSpan={colSpan} align="center">
                            <strong>Market Name: {area}</strong>
                            <br />
                            <Typography variant="caption">
                                Data from {newDate} {newLoadTime}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                                (Count=<strong>{DisplayNumber.format(counts.count)}</strong>&nbsp;
                                {ACTORS[source.toUpperCase()].SHOWDISCLAIMER && (
                                    <>
                                        {' '}
                                        Details=<strong>{DisplayNumber.format(counts.mapCount)}</strong>&nbsp;
                                    </>
                                )}
                                Uniques=<strong>{DisplayNumber.format(counts.unique)}</strong>&nbsp; For Sale=
                                <strong>{DisplayNumber.format(counts.uniqueFs)}</strong>&nbsp; Sold=
                                <strong>{DisplayNumber.format(counts.uniqueSold)}</strong>)
                                <HelpIcon
                                    color="info"
                                    fontSize="small"
                                    onMouseEnter={handleHelpPopoverOpen}
                                    onMouseLeave={handleHelpPopoverClose}
                                />
                                <Popover
                                    id="mouse-over-popover"
                                    sx={{
                                        pointerEvents: 'none',
                                    }}
                                    open={openHelp}
                                    anchorEl={anchorHelpEl}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                    onClose={handleHelpPopoverClose}
                                    disableRestoreFocus
                                >
                                    <Typography sx={{ p: 2 }}>
                                        <Typography variant="caption">
                                            <b>Count:</b> Total number of agent listings (details and non-details)
                                            <br />
                                            {ACTORS[source.toUpperCase()].SHOWDISCLAIMER && (
                                                <>
                                                    {' '}
                                                    <b>Details:</b> Total numbers of listings that has details
                                                    <br />
                                                </>
                                            )}
                                            <b>Uniques:</b> Total number of unique listings
                                            <br />
                                            <b>For Sale:</b> Total number of unique listings for sale
                                            <br />
                                            <b>Sold:</b> Total number of unique listings that were sold
                                        </Typography>
                                    </Typography>
                                </Popover>
                            </Typography>
                            {detailsLoading ? (
                                <div width="100%">
                                    <CircularProgress size={20} />
                                    <Typography variant="caption">Please wait...Loading Listing Details...</Typography>
                                </div>
                            ) : (
                                !data.meta.hasDetails &&
                                source === 'zillow' && (
                                    <div width="100%">
                                        <Button
                                            variant="outlined"
                                            onClick={onGetDetailsClick}
                                            startIcon={<BrowserUpdatedIcon />}
                                            size="small"
                                        >
                                            More details
                                        </Button>
                                    </div>
                                )
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: tableHeader[value].color }}>
                        {/* <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell> */}
                        <TableCell colSpan={colSpan} align="center" sx={{ color: tableHeader[value].textColor }}>
                            <strong>{tableHeader[value].text}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2} align="center">
                            DataTree.com
                        </TableCell>
                        <TableCell>&nbsp;</TableCell>
                        {Object.keys(matrix[source].time).map(
                            (time) =>
                                time !== '' &&
                                time && (
                                    <TableCell
                                        key={time}
                                        variant="header"
                                        sx={{ color: '#808080' }}
                                        align="center"
                                        colSpan={2}
                                    >
                                        <strong>{time}</strong>
                                    </TableCell>
                                ),
                        )}
                    </TableRow>
                    {!tableHeader[value].comingSoon && (
                        <TableRow>
                            <TableCell variant="header">
                                <strong>Total Parcels</strong>
                            </TableCell>
                            <TableCell variant="header">
                                <strong>Vacant Parcels</strong>
                            </TableCell>
                            <TableCell variant="header">
                                <strong>Acres</strong>
                            </TableCell>
                            {colLoop.map((_, i) => (
                                <BigDataTableHeader key={i} bg={commonBgColor} columns={tableHeader[value].columns} />
                            ))}
                        </TableRow>
                    )}
                </TableHead>
                {!tableHeader[value].comingSoon ? (
                    <TableBody>
                        {Object.keys(matrix[source].lot).map((lot) => (
                            <TableRow
                                key={lot}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    '& td, & td span, & td a, & td p':
                                        lot.toLowerCase() === 'total'
                                            ? {
                                                  fontSize: '1.1em !important',
                                                  fontWeight: 'bold !important',
                                              }
                                            : {},
                                    borderTop:
                                        lot.toLowerCase() === 'total'
                                            ? '5px double rgba(224, 224, 224, 1) !important'
                                            : '',
                                }}
                            >
                                <TableCell align="center">
                                    <Typography variant="caption">TBD</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="caption">TBD</Typography>
                                </TableCell>
                                <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {lot.toUpperCase()}
                                </TableCell>
                                {Object.keys(matrix[source].time).map((time) => (
                                    <DataCell
                                        key={`${time}${lot}${tableHeader[value].dataField}`}
                                        data={data}
                                        lot={lot}
                                        time={time}
                                        field={tableHeader[value].dataField}
                                        onClick={(e, p, ref) => {
                                            onClick(e, p, ref);
                                        }}
                                        open={open}
                                        anchorEl={anchorEl}
                                        onMouseEnter={(e, text) => handlePopoverOpen(e, text)}
                                        onMouseLeave={handlePopoverClose}
                                        source={source}
                                    />
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                ) : (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={colSpan} align="center">
                                Coming soon!
                            </TableCell>
                        </TableRow>
                    </TableBody>
                )}
            </Table>
            <Popover
                id="mouse-over-popover"
                sx={{
                    pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Typography sx={{ p: 2 }}> {popoverText}</Typography>
            </Popover>
        </TableContainer>
    );
};

BigDataTable.propTypes = {
    value: PropTypes.string,
    data: PropTypes.object,
    onClick: PropTypes.func,
    area: PropTypes.string,
    date: PropTypes.string,
    source: PropTypes.string,
    loadTime: PropTypes.string,
    onGetDetailsClick: PropTypes.func,
    detailsLoading: PropTypes.bool,
};

BigDataTable.defaultProps = {
    detailsLoading: false,
};
