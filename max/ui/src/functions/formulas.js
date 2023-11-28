import { DisplayNumber } from './functions.js';

export const getListOfField = (listings, field) => listings.map((listing) => listing[field]).filter((el) => el);

export const getSum = (ary) => (ary.length === 0 ? 0 : ary.reduce((a, b) => a + b, 0));

export const calcPpa = (price, acre) => (acre === 0 ? 0 : parseInt((price / acre).toFixed(0)));

export const calcRatio = (sale, sold) => {
    if (!sold || sold === 0 || sold === 'N/A') return '0%';
    const num = ((sale / sold) * 100).toFixed(0);
    const formattedNumber = DisplayNumber.format(num);
    return `${formattedNumber}%`;
};

export const calcMos = (sale, sold, time) => {
    const calcDaysOf30 = (time) => {
        return time / 30;
    };

    const calcDaysInTimeFrame = {
        '1 day': calcDaysOf30(1),
        '3 days': calcDaysOf30(3),
        '7 days': calcDaysOf30(7),
        '14 days': calcDaysOf30(14),
        '1 week': calcDaysOf30(7),
        '30 days': calcDaysOf30(30),
        '1 month': calcDaysOf30(30),
        '45 days': calcDaysOf30(45),
        '90 days': calcDaysOf30(90),
        '3 months': calcDaysOf30(90),
        '6 months': calcDaysOf30(180),
        '12 months': calcDaysOf30(360),
        '1 year': calcDaysOf30(360),
        '24 months': calcDaysOf30(720),
        '2 years': calcDaysOf30(720),
        '36 months': calcDaysOf30(1080),
        '3 years': calcDaysOf30(1080),
        '5 years': calcDaysOf30(1800),
    };

    if (!sold || sold === 0 || sold === 'N/A') return '0.00';

    return ((sale / sold) * calcDaysInTimeFrame[time.toLowerCase()]).toFixed(2);
};

export const calcAbsorption = (sale, sold) => {
    if (!sale || sale === 0 || sale === 'N/A') return '0.00%';

    return `${((sold / sale) * 100).toFixed(2)}%`;
};

export const sqft2acre = (num) => (num === '' ? '' : parseFloat((num / 43560).toFixed(2)));

export const calcDom = (history) => {
    // if the first item is 'listed for sale, then seconds from now to them'
    if (history.length === 0) return 0;

    const epochNow = Date.now();
    let aryOfMs = [];

    let firstEventListed = false;
    const firstEvent = history[0].event.toLowerCase();
    if (firstEvent === 'listed for sale') {
        const firstEventTime = history[0].time;
        aryOfMs = [epochNow - firstEventTime];
        firstEventListed = true;
    }

    let startHit = false;
    // let endHit = false;
    let startValue;
    let endValue;
    for (let i = firstEventListed ? 1 : 0; i < history.length; i++) {
        // Find start time
        if (['listing removed', 'sold'].includes(history[i].event.toString().toLowerCase())) {
            startHit = true;
            startValue = history[i].time;
        }
        if (history[i].event.toString().toLowerCase() === 'listed for sale') {
            if (startHit) {
                endValue = history[i].time;
                aryOfMs = [...aryOfMs, startValue - endValue];
                startHit = false;
            }
        }
    }

    //console.log({ aryOfMs })

    const totalMs = aryOfMs.reduce((a, b) => a + b, 0);
    return Math.round(totalMs / 86400000);
};
