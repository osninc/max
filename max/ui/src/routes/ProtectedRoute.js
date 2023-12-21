import { Button, Container, Grid, Typography } from '@mui/material';
import { useAuth } from './AuthProvider';
import PropTypes from 'prop-types';

const PLANS = {
    FULL: { label: 'FULL ACCESS', uid: 'wQXwbnmK' },
};

function hasCorrectPlan(plans, user) {
    if (user) {
        const planIdForUser = user.Account?.CurrentSubscription?.Plan?.Uid;
        return !!plans.find((plan) => plan.uid === planIdForUser);
    } else {
        return false;
    }
}

export default function ProtectedRoute({ children }) {
    const { user, openLogin, openSignup, openProfile, isLoading } = useAuth();

    // Pro routes only accessible with pro plan
    // Basic routes accessible with basic or pro plan
    const plansWithAccess = [PLANS.FULL];
    const allowAccess = hasCorrectPlan(plansWithAccess, user);

    if (isLoading) return <p>Authenticating...</p>;

    if (allowAccess) {
        return children;
    } else if (user) {
        return (
            <Container fixed maxWidth={false}>
                <Grid container spacing={0} alignItems="left">
                    <p>
                        To access this content you need to upgrade to the <strong>{plansWithAccess[0].label}</strong>{' '}
                        plan.
                    </p>
                    <button onClick={() => openProfile({ tab: 'planChange' })}>Upgrade</button>
                </Grid>
            </Container>
        );
    } else {
        return (
            <Container maxWidth="sm">
                <Grid item spacing={0} justifyContent="center" alignItems="center">
                    <Typography align="center">
                        To access this content you need to{' '}
                        <Button
                            variant="link"
                            color="primary"
                            onClick={openSignup}
                            underline="none"
                            //sx={{ my: 1, mx: 1.5 }}
                        >
                            signup
                        </Button>
                        {' for the  '}
                        <strong>{plansWithAccess[0].label}</strong> plan.
                    </Typography>

                    <Typography align="center">
                        Or{' '}
                        <Button variant="link" color="primary" onClick={openLogin} underline="none">
                            login
                        </Button>{' '}
                        if you already have an account.
                    </Typography>
                </Grid>
            </Container>
        );
    }
}

ProtectedRoute.propTypes = {
    pro: PropTypes.bool,
    children: PropTypes.node,
};
