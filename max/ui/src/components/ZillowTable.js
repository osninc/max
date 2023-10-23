import { Button, ButtonGroup, Paper, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import React, { useState } from "react";
import { lotMatrix, statusMatrix, timeMatrix } from "../constants/matrix.js";
import { blue, cyan, green, yellow } from '@mui/material/colors';
import { ThirdPartyIcon } from "./ThirdPartyIcon.js";
import { DisplayNumber, USDollar, convertDateToLocal, sec2min } from "../functions/functions.js";

const columnColor = {
    "sold": "white",
    "for sale": "white"
}

const ZillowHeader = props => {
    const { bg, columns } = props

    return (
        <>
            {[...Array(columns.cols)].map((_, i) => {
                return <TableCell key={i} colSpan={columns.colspan} sx={{ backgroundColor: bg[i] }} align="center">{columns.colText[i]}</TableCell>
            })}
        </>
    )
}

const DataCell = props => {
    const {
        data: counts,
        lot,
        time,
        onClick,
        field,
        open,
        onMouseEnter,
        onMouseLeave
    } = props;
    const record = counts[lot][time]

    const calcDaysInTimeFrame = {
        "7 days": 7,
        "30 days": 30,
        "90 days": 90,
        "6 months": 180,
        "12 months": 360,
        "24 months": 720,
        "36 months": 1080
    }

    const typographyParams = {
        variant: "body2"
    }

    if (["count", "avgPrice", "avgPpa"].includes(field)) {


        const sold = record ? record["sold"] : null
        const sale = record ? record["for sale"] : null;

        const lcLot = lot.toLowerCase();

        let commonParams = {
            "time": timeMatrix[time.toLowerCase()],
            lot: lcLot
        }
        if (lotMatrix[lcLot].minLotSize !== "")
            commonParams = { ...commonParams, "minLotSize": lotMatrix[lcLot].minLotSize.toString() }
        if (lotMatrix[lcLot].maxLotSize !== "")
            commonParams = { ...commonParams, "maxLotSize": lotMatrix[lcLot].maxLotSize.toString() }

        const buttonGroupParams = {
            disableElevation: true,
            variant: "text",
            size: "small",
            sx: { minWidth: 10 }
        }

        // clicked params
        let soldParams;
        let soldHtml = "N/A"
        let soldTextButton;
        let soldHover = "";
        let soldText = "";

        if (sold) {
            soldText = sold[field];
            soldParams = {
                ...commonParams,
                "status": statusMatrix["sold"],
                count: sold.count,
                mapCount: sold.mapCount
            }
            switch (field) {
                case "avgPrice":
                case "avgPpa":
                    soldText = USDollar.format(soldText);
                    soldTextButton = <Button href="#" onClick={(e) => onClick(e, soldParams)}>{soldText}</Button>
                    break;
                case "count":
                    soldTextButton = <ButtonGroup
                        {...buttonGroupParams}
                    >
                        <Button href="#" onClick={(e) => onClick(e, soldParams)} sx={{ color: "black" }}><strong>{DisplayNumber.format(soldText)}</strong></Button>
                        <Button href={sold.url} rel="noreferrer" target="_blank">
                            <ThirdPartyIcon site="zillow" size="xs" />
                        </Button>
                    </ButtonGroup>
                    break;
                default:
                    soldTextButton = soldText;
                    break;

            }
            soldHtml = soldTextButton;
        }

        let saleParams;
        let saleHtml = "N/A"
        let saleTextButton;
        let saleHover = "";
        let saleText = ""

        if (sale) {

            saleText = sale[field];
            saleParams = {
                ...commonParams,
                "status": statusMatrix["for sale"],
                count: sale.count,
                mapCount: sale.mapCount
            }
            switch (field) {
                case "avgPrice":
                case "avgPpa":
                    saleText = USDollar.format(saleText);
                    saleTextButton = <Button href="#" onClick={(e) => onClick(e, saleParams)}>{saleText}</Button>
                    break;
                case "count":
                    saleTextButton = <ButtonGroup
                        {...buttonGroupParams}
                    >
                        <Button href="#" onClick={(e) => onClick(e, saleParams)}>{DisplayNumber.format(saleText)}</Button>
                        <Button href={sale.url} rel="noreferrer" target="_blank">
                            <ThirdPartyIcon site="zillow" size="xs" />
                        </Button>
                    </ButtonGroup>
                    break;
                default:
                    saleTextButton = saleText;
                    break;
            }
            saleHtml = saleTextButton;
        }

        let moreSaleText = "";
        let moreSoldText = "";
        if (record["for sale"].numPrices >= 500)
            moreSaleText = <strong>DISCLAIMER: Results are limited to 500 records<br /></strong>;
        if (record["sold"].numPrices >= 500)
            moreSoldText = <strong>DISCLAIMER: Results are limited to 500 records<br /></strong>;
        switch (field) {
            case "avgPrice":
                saleHover = <Typography variant="caption">
                    {moreSaleText}
                    This value is the sum of all {record["for sale"].numPrices} available prices
                    divided by the Number of Listings that had a price listed<br />
                    {USDollar.format(record["for sale"].sumPrice)} / {record["for sale"].numPrices} = {saleText}
                </Typography>
                soldHover = <Typography variant="caption">
                    {moreSoldText}
                    This value is the sum of all {record["sold"].numPrices} available prices
                    divided by the Number of Sales that had a price listed<br />
                    {USDollar.format(record["sold"].sumPrice)} / {record["sold"].numPrices} = {soldText}
                </Typography>;
                break;
            case "avgPpa":
                saleHover = <Typography variant="caption">
                    {moreSaleText}
                    This value is the sum of each of the listing's individual price per acre
                    divided by  ({record["for sale"].numPrices}) listings<br />
                    sum(price/acre) / {record["for sale"].numPrices} = {saleText}
                </Typography>
                soldHover = <Typography variant="caption">
                    {moreSoldText}
                    This value is the sum of each of the sale's individual price per acre
                    divided by  ({record["sold"].numPrices}) sales <br />
                    sum(price/acre) / {record["sold"].numPrices} = {soldText}
                </Typography>;
                break;
            default:
                break;
        }
        return (
            <React.Fragment key={`${lot}${time}`}>
                <TableCell align="center" sx={{ backgroundColor: columnColor["for sale"] }}>
                    {(saleHover === "") ? saleHtml : (
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

                <TableCell align="center" sx={{ backgroundColor: columnColor["sold"] }}>
                    {(soldHover === "") ? soldHtml : (
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
        )
    }
    else {
        // Possible hover
        let text = "";
        switch (field) {
            case "mos":
                text = <Typography variant="caption">
                    This value was calculated by Number of Active Listings ({record["for sale"].count})
                    divided by Number of Sales ({record["sold"].count}) multiplied by the number of days ({calcDaysInTimeFrame[time.toLowerCase()]})
                    divided by 30 days<br />
                    {record["for sale"].count} / {record["sold"].count} * {calcDaysInTimeFrame[time.toLowerCase()]} / 30 = {record[field]}
                </Typography>
                break;
            case "absorption":
                text = <Typography variant="caption">
                    This value is the percentage of the Number of Sales ({record["sold"].count})
                    divided by Number of Listings ({record["for sale"].count})<br />
                    {record["sold"].count} / {record["for sale"].count} * 100% = {record[field]}
                </Typography>
                break;
            case "ratio":
                text = <Typography variant="caption">
                    This value is the percentage of the Number of Listings ({record["for sale"].count})
                    divided by Number of Sales ({record["sold"].count})<br />
                    {record["for sale"].count} / {record["sold"].count} * 100% = {record[field]}
                </Typography>
                break;
            default:
                break;
        }
        return (
            <TableCell align="center" colSpan={2} sx={{ backgroundColor: columnColor["for sale"] }}>
                {(text === "") ? record[field] : (
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
        )
    }
}

const ComingSoon = props => {
    const {
        area,
        header,
        date,
    } = props
    return (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="simple table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#dddddd" }}>
                        <TableCell align="center"><strong>Market Name: {area}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: header.color }}>
                        <TableCell align="center" sx={{ color: header.textColor }} ><strong>{header.text}</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell align="center">Coming soon!</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export const ZillowTable = ({ value, data, onClick, area, date, source, loadTime }) => {
    const newDate = convertDateToLocal(date)
    const newLoadTime = (loadTime > 0) ? `(${sec2min(loadTime)})` : "";
    const commonColText = [<Typography sx={{ color: "#505050" }} variant="body2">Listed</Typography>, <strong>Sold</strong>]
    const commonBgColor = ["white", "white"]
    const commonHeaderParams = {
        color: "#626262",
        textColor: "white"
    }
    const tableHeader = {
        0: {
            ...commonHeaderParams,
            text: "Sales & Listing Counts",
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: "count"
        },
        1: {
            text: "Average Prices for Sold & Listed Land",
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: "avgPrice"
        },
        2: {
            text: "List/Sale Ratio",
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ["Ratio L/S"],
            },
            comingSoon: false,
            dataField: "ratio"
        },
        3: {
            text: "PPA: Price/Per Acre",
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: false,
            dataField: "avgPpa"
        },
        4: {
            text: "Months of Supply",
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ["MoS"],
            },
            comingSoon: false,
            dataField: "mos"
        },
        5: {
            text: "DOM Days on Market",
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: true,
            dataField: "count"
        },
        6: {
            text: "Realtors",
            ...commonHeaderParams,
            columns: {
                cols: 2,
                colspan: 1,
                colText: commonColText,
            },
            comingSoon: true,
            dataField: "count"
        },
        7: {
            text: "Absorption Rate",
            ...commonHeaderParams,
            columns: {
                cols: 1,
                colspan: 2,
                colText: ["Absorption"],
            },
            comingSoon: false,
            dataField: "absorption"
        }
    }

    const colSpan = 14;

    // For hovering
    const [anchorEl, setAnchorEl] = useState(null);
    const [popoverText, setPopoverText] = useState("")
    const handlePopoverOpen = (event, text) => {
        setPopoverText(text)
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    // calculate columns loop
    const colLoop = [...Array(7)]

    // Calculate 
    const filteredData = Object.keys(data).map(acreage => Object.keys(data[acreage]).map(time => {
        const fsListingCount = data[acreage][time]["for sale"]?.count
        const fsMapCount = data[acreage][time]["for sale"]?.mapCount
        const soldListingCount = data[acreage][time]["sold"]?.count
        const soldMapCount = data[acreage][time]["sold"]?.mapCount


        return {
            count: fsListingCount + soldListingCount,
            mapCount: fsMapCount + soldMapCount,
            listings: [...data[acreage][time]["for sale"].listings, ...data[acreage][time]["sold"].listings],
            fsListings: data[acreage][time]["for sale"].listings,
            soldListings: data[acreage][time]["sold"].listings,
            forSale: fsListingCount,
            sold: soldListingCount
        }
    })).map(x => {
        return {
            mapCount: x.filter(el => el.mapCount !== "N/A").reduce((a, b) => a + b.mapCount, 0),
            count: x.filter(el => el.count !== "N/A").reduce((a, b) => a + b.count, 0),
            listings: x.map(xx => xx.listings),
            fsListings: x.map(xx => xx.fsListings),
            soldListings: x.map(xx => xx.soldListings),
            forSale: x.reduce((a, b) => a + b.forSale, 0),
            sold: x.reduce((a, b) => a + b.sold, 0)
        }
    })

    const firstFsFlat = filteredData.map(data => data.fsListings.map(d => d.map(e => e.zpid))).flat(1)
    const secondFsFlat = firstFsFlat.filter(el => el).flat(1)
    const uniqueFs = secondFsFlat.filter((value, index, array) => array.indexOf(value) === index)


    const firstSoldFlat = filteredData.map(data => data.soldListings.map(d => d.map(e => e.zpid))).flat(1)
    const secondSoldFlat = firstSoldFlat.filter(el => el).flat(1)
    const uniqueSold = secondSoldFlat.filter((value, index, array) => array.indexOf(value) === index)

    const firstAllFlat = filteredData.map(data => data.listings.map(d => d.map(e => e.zpid))).flat(1)
    const secondAllFlat = firstAllFlat.filter(el => el).flat(1)
    const uniqueAll = secondAllFlat.filter((value, index, array) => array.indexOf(value) === index)


    const counts = {
        mapCount: filteredData.filter(el => el.mapCount !== "N/A").reduce((a, b) => a + b.mapCount, 0),
        count: filteredData.filter(el => el.count !== "N/A").reduce((a, b) => a + b.count, 0),
        unique: uniqueAll.length,
        uniqueFs: uniqueFs.length,
        uniqueSold: uniqueSold.length,
        forSale: filteredData.reduce((a, b) => a + b.forSale, 0),
        sold: filteredData.reduce((a, b) => a + b.sold, 0)
    }

    return (
        ((value === 6) || (source !== "zillow")) ? (
            <ComingSoon area={area} header={tableHeader[value]} date={newDate} />
        ) : (
            <TableContainer component={Paper}>
                <Table size="small" aria-label="simple table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#dddddd" }}>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell colSpan={colSpan} align="center"><strong>Market Name: {area}</strong><br />
                                <Typography variant="caption">
                                    Data from {newDate} {(newLoadTime)}
                                </Typography><br />
                                <Typography variant="caption">
                                    (Count=<strong>{DisplayNumber.format(counts.count)}</strong>&nbsp;
                                    Details=<strong>{DisplayNumber.format(counts.mapCount)}</strong>&nbsp;
                                    Uniques=<strong>{DisplayNumber.format(counts.unique)}</strong>&nbsp;
                                    For Sale=<strong>{DisplayNumber.format(counts.uniqueFs)}</strong>&nbsp;
                                    Sold=<strong>{DisplayNumber.format(counts.uniqueSold)}</strong>)
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: tableHeader[value].color }}>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell colSpan={colSpan} align="center" sx={{ color: tableHeader[value].textColor }}><strong>{tableHeader[value].text}</strong></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            {Object.keys(timeMatrix).map(time => (
                                (time !== "") &&
                                (time) &&
                                <TableCell key={time} variant="header" sx={{ color: "#808080" }} align="center" colSpan={2}><strong>{time}</strong></TableCell>
                            ))}
                        </TableRow>
                        {(!tableHeader[value].comingSoon) && (
                            <TableRow>
                                <TableCell variant="header"><strong>Total Parcels</strong></TableCell>
                                <TableCell variant="header"><strong>Vacant Parcels</strong></TableCell>
                                <TableCell variant="header"><strong>Acres</strong></TableCell>
                                {colLoop.map((_, i) => (
                                    <ZillowHeader
                                        key={i}
                                        bg={commonBgColor}
                                        columns={tableHeader[value].columns}
                                    />
                                ))}
                            </TableRow>
                        )}
                    </TableHead>
                    {(!tableHeader[value].comingSoon) ? (
                        <TableBody>
                            {Object.keys(lotMatrix).map(lot => (
                                <TableRow
                                    key={lot}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell align="center"><Typography variant="caption">TBD</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="caption">TBD</Typography></TableCell>
                                    <TableCell align="center">{lot.toUpperCase()}</TableCell>
                                    {Object.keys(timeMatrix).map(time => (
                                        <DataCell
                                            key={`${time}${lot}${tableHeader[value].dataField}`}
                                            data={data}
                                            lot={lot}
                                            time={time}
                                            field={tableHeader[value].dataField}
                                            onClick={(e, p) => {
                                                onClick(e, p)
                                            }}
                                            open={open}
                                            anchorEl={anchorEl}
                                            onMouseEnter={(e, text) => handlePopoverOpen(e, text)}
                                            onMouseLeave={handlePopoverClose}
                                        />
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={colSpan} align="center">Coming soon!</TableCell>
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
        )
    )
}
