import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import { CircularProgressTimer } from './Listings/CircularProgressTimer';

const Timer = props => {
    const { start, startValue, onUpdate } = props
    const [seconds, setSeconds] = useState(startValue);
    const [isActive, setIsActive] = useState(start);

    function toggle() {
        setIsActive(!isActive);
    }

    function reset() {
        setSeconds(0);
        setIsActive(false);
    }

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds + 1);
                if (onUpdate) onUpdate(seconds + 1)
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [seconds]);

    return (
        <div className="app">
            <div className="time">
                {seconds}s
            </div>
        </div>
    );
};

Timer.propTypes = {
    start: PropTypes.bool,
    listings: PropTypes.number,
    onUpdate: PropTypes.func
};

Timer.defaultProps = {
    start: true,
    startValue: 0
}

export default Timer;