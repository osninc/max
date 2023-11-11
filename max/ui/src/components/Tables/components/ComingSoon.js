import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

export const ComingSoon = props => {
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