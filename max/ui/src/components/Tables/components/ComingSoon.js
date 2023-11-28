import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PropTypes from 'prop-types';

export const ComingSoon = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { area, header, date } = props;
    return (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="simple table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#dddddd' }}>
                        <TableCell align="center">
                            <strong>Market Name: {area}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: header.color }}>
                        <TableCell align="center" sx={{ color: header.textColor }}>
                            <strong>{header.text}</strong>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell align="center">Coming soon!</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

ComingSoon.propTypes = {
    area: PropTypes.string,
    header: PropTypes.object,
    date: PropTypes.string,
};
