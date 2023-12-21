import { Link, Typography } from '@mui/material';

export const Copyright = (props) => {
    return (
        <Typography variant="body2" color="secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://land-stats.com">
                land-stats.com
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
};
