import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
//import { CircularProgressTimer } from './Listings/CircularProgressTimer';

const Timer = (props) => {
    const { start, startValue, onUpdate } = props;
    const [seconds, setSeconds] = useState(startValue);
    const [isActive, setIsActive] = useState(start);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toggle = () => setIsActive(!isActive);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reset = () => {
        setSeconds(0);
        setIsActive(false);
    };

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds((seconds) => seconds + 1);
                if (onUpdate) onUpdate(seconds + 1);
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [seconds]);

    return (
        <div className="app">
            <div className="time">{seconds}s</div>
        </div>
    );
};

Timer.propTypes = {
    start: PropTypes.bool,
    startValue: PropTypes.number,
    listings: PropTypes.number,
    onUpdate: PropTypes.func,
};

Timer.defaultProps = {
    start: true,
    startValue: 0,
};

export default Timer;
