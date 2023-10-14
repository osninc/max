export const getListOfField = (listings, field) => listings.map(listing => listing[field]).filter(el => el);

export const getSum = ary => (ary.length === 0) ? 0 : ary.reduce((a, b) => a + b, 0);

export const calcPpa = (price, acre) => (acre === 0) ? 0 : parseInt((price / acre).toFixed(0));

export const calcRatio = (sale, sold) => {
    if (!sold || (sold === 0) || (sold === "N/A")) return "0%";
    return `${((sale / sold) * 100).toFixed(0)}%`;
}

export const calcMos = (sale, sold, time) => {

    const calcDaysOf30 = (time) => {
        return time / 30;
    }

    const calcDaysInTimeFrame = {
        "7 days": calcDaysOf30(7),
        "30 days": calcDaysOf30(30),
        "90 days": calcDaysOf30(90),
        "6 months": calcDaysOf30(180),
        "12 months": calcDaysOf30(360),
        "24 months": calcDaysOf30(720),
        "36 months": calcDaysOf30(1080)
    }

    if (!sold || (sold === 0) || (sold === "N/A")) return "0.00";

    return (sale / sold * calcDaysInTimeFrame[time.toLowerCase()]).toFixed(2);
}

export const calcAbsorption = (sale, sold) => {
    if (!sale || (sale === 0) || (sale === "N/A")) return "0.00%";

    return `${((sold / sale) * 100).toFixed(2)}%`
}

export const sqft2acre = num => (num === "") ? "" : parseFloat((num / 43560).toFixed(2));
