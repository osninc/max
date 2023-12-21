import { Link, Typography } from '@mui/material';
import { convertDateToLocal } from '../functions/functions';

export const Copyright = (props) => {
    return (
        <Typography variant="body2" color="secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://land-stats.com">
                land-stats.com
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
            <br />
            build: {process.env.REACT_APP_BUILD_ID}
            <br />
            built at: {convertDateToLocal(process.env.REACT_APP_BUILD_TIME)}
        </Typography>
    );
};
