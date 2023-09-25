
import testCounts from "../test_data/dataset_maxeverythingcount_2023-09-23_19-03-24-717.json" assert { type: "json" }

export const testOrderData = (statusMatrix, timeMatrix, lotSize) => {
    //console.log("testOrderdata");
    // console.log(statusMatrix, timeMatrix, lotSize)

    // Sort by order of matrix
    // x axis is lot size
    // const lots = testCounts.filter(x => )

    const result = testCounts.reduce((x, y) => {

        (x[y.minLotSize] = x[y.minLotSize] || []).push(y);

        return x;

    }, {});


    // Reduce the reduce
    const returnValue = Object.entries(result).map(kv => {
        const [key, value] = kv
        const newKey = key === "" ? 0 : parseInt(key)
        // Reduce by time
        const timeDim = value.reduce((x, y) => {


            (x[y.time] = x[y.time] || []).push({
                status: y.status,
                count: y.count,
                url: ""
            });

            return x;

        }, {});
        return { [newKey]: timeDim };
    })

    return returnValue;
}

export const orderData = () => {
    return "hi"
}