import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

/*
 * Setting up a auth context to be used globally
 *
 */

const AuthContext = createContext({});

export function useAuth() {
    return useContext(AuthContext);
}

// Outseta is added to the window by the
// Outseta script added to the head in ../public/index.html
function getOutseta() {
    if (window['Outseta']) {
        return window['Outseta'];
    } else {
        throw new Error('Outseta is missing, have you added the script to head?');
    }
}

export default function AuthProvider({ children }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState('init');
    const [user, setUser] = useState();

    // Save a reference to Outseta
    const outsetaRef = useRef(getOutseta());

    useEffect(() => {
        // Set up handling of user related events
        //handleOutsetaUserEvents(updateUser);

        // Get the access token from the callback url
        const accessToken = searchParams.get('access_token');

        if (accessToken) {
            // If there is an acccess token present
            // pass it along to Outseta
            outsetaRef.current.setAccessToken(accessToken);

            // and clean up
            setSearchParams({});
        }

        if (outsetaRef.current.getAccessToken()) {
            // Outseta initalized with an authenticated user.
            updateUser();
        } else {
            // Outseta initalized without authenticated user.
            setStatus('ready');
        }

        return () => {
            // Clean up user related event subscriptions
            handleOutsetaUserEvents(() => {});
        };
    }, [searchParams, setSearchParams]);

    const updateUser = async () => {
        // Fetch the current user data from outseta
        const outsetaUser = await outsetaRef.current.getUser();
        // Update user state
        setUser(outsetaUser);
        // Make sure status = ready
        setStatus('ready');
    };

    const handleOutsetaUserEvents = (onEvent) => {
        // Subscribe to user related events
        // with onEvent function
        const outseta = outsetaRef.current;
        outseta.on('subscription.update', onEvent);
        outseta.on('profile.update', onEvent);
        outseta.on('account.update', onEvent);
    };

    const logout = () => {
        // Unset access token
        outsetaRef.current.setAccessToken('');
        // and remove user state
        setUser(null);
    };

    const openLogin = (options) => {
        outsetaRef.current.auth.open({
            widgetMode: 'login|register',
            authenticationCallbackUrl: window.location.href,
            ...options,
        });
    };

    const openSignup = (options) => {
        outsetaRef.current.auth.open({
            widgetMode: 'register',
            authenticationCallbackUrl: window.location.href,
            ...options,
        });
    };

    const openProfile = (options) => {
        outsetaRef.current.profile.open({ tab: 'profile', ...options });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: status !== 'ready',
                logout,
                openLogin,
                openSignup,
                openProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node,
};
