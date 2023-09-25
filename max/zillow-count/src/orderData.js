
import testCounts from "../test_data/dataset_maxeverythingcount_2023-09-23_19-03-24-717.json" assert { type: "json" }
import { camelizeStr } from "./functions.js";

export const testOrderData = (statusMatrix, timeMatrix, lotSize) => {
    //console.log("testOrderdata");
    // console.log(statusMatrix, timeMatrix, lotSize)

    // Sort by order of matrix
    // x axis is lot size
    // const lots = testCounts.filter(x => )

    const result2 = testCounts.reduce((x, y) => {

        (x[y.minLotSize] = x[y.minLotSize] || []).push(y);

        return x;

    }, {});


    const result = testCounts.reduce((x, y) => {
        let keyName = `${y.minLotSize}-${y.maxLotSize}`;

        if (y.maxLotSize === "") keyName = `${y.minLotSize}+`;
        if (y.minLotSize === "") keyName = `0-${y.maxLotSize}`;

       
        // Keyname would be column titles
        //const keyName = `${y.time} - ${y.status}`;


        (x[keyName] = x[keyName] || []).push({
            //size: (y.maxLotSize === "") ? `${y.minLotSize}+` : (y.minLotSize === "") ? `0-${y.maxLotSize}` : `${y.minLotSize}-${y.maxLotSize}`,
            [`${y.time} - ${y.status}`]: y.count
        });

        return x;

    }, {});


    const result4 = testCounts.map(y => {
        const sizeLabel = (y.maxLotSize === "") ? `${y.minLotSize}+` : (y.minLotSize === "") ? `0-${y.maxLotSize}` : `${y.minLotSize}-${y.maxLotSize}`;
        return {
            size: sizeLabel,
            [`${y.time} - ${y.status}`]: y.count,
            url: ""
        }
    })


    // Reduce the reduce
    // const returnValue = Object.entries(result).map(kv => {
    //     const [key, value] = kv
    //     const newKey = key === "" ? 0 : parseInt(key)
    //     // Reduce by time
    //     const timeDim = value.reduce((x, y) => {


    //         (x[y.time] = x[y.time] || []).push({
    //             status: y.status,
    //             count: y.count,
    //             url: ""
    //         });

    //         return x;

    //     }, {});
    //     return { [newKey]: timeDim };
    // })

    // Fix data that apify would understand
    //console.log

    // Make a new JSON for correct display
    const returnValue = Object.entries(result).map(kv => {

        const [key, value] = kv

        //const sizeLabel = (y.maxLotSize === "") ? `${y.minLotSize}+` : (y.minLotSize === "") ? `0-${y.maxLotSize}` : `${y.minLotSize}-${y.maxLotSize}`;

        
        let newValue = {
            size: key
        }
        value.map(v => {
            newValue = {
                ...newValue,
                ...v
            }
        })
        return newValue;
    })

    return returnValue;
}

export const orderData = (data) => {

    const result = testCounts.reduce((x, y) => {
        let keyName = `${y.minLotSize}-${y.maxLotSize}`;

        if (y.maxLotSize === "") keyName = `${y.minLotSize}+`;
        if (y.minLotSize === "") keyName = `0-${y.maxLotSize}`;

        (x[keyName] = x[keyName] || []).push({
            [camelizeStr(`${y.time} - ${y.status}`)]: y.count
        });

        return x;

    }, {});

    // Make a new JSON for correct display
    const returnValue = Object.entries(result).map(kv => {

        const [key, value] = kv

        let newValue = {
            lotSize: key
        }
        value.map(v => {
            newValue = {
                ...newValue,
                ...v
            }
        })
        return newValue;
    })

    return returnValue;
}