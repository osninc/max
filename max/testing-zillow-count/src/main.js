import { Actor } from "apify";
import axios from "axios";
import counties from "./data/counties.json" assert {type: "json"};

const later = (delay, value) =>
    new Promise(resolve => setTimeout(resolve, delay, value));

const reject = () => Promise.reject(new Error('forced error'));

const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const {
    state,
    build,
    maxConcurrency,
    proxyType
} = input;

// Get all counties of that state
const allCounties = counties.filter(county => county.state_id === state)

const APIFYURL = `https://api.apify.com/v2/acts/land-stats~zillow-count/run-sync?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H&build=${build}`
const inputBase = {
    county: "",
    dataSavingStoreType: "DATASET",
    forceCleanSessionsCreation: false,
    maxConcurrency: 50,
    proxyType,
    scraper: "AXIOS",
    searchType: "county"
}

const numCounties = allCounties.length;
const TESTCOUNTY = "Kalawao County"
console.log(`Number of counties in ${state}: ${numCounties}`)

const outsideLoop = Math.floor(numCounties / maxConcurrency)
for (let x = 0; x < outsideLoop + 1; x++) {
    let aryPromises = []
    for (let y = 0; y < maxConcurrency; y++) {
        const currentIndex = maxConcurrency * x + y;
        if (currentIndex < numCounties) {
            // do the work here
            //console.log({currentIndex})
            const countyName = allCounties[currentIndex].county_full
            const currentCounty = `${countyName}, ${allCounties[currentIndex].state_id}`;
            let currentStatus = "(Working...)";
            const rInt = getRandomInt(10)
            console.log(`${currentIndex + 1}. ${currentCounty} - ${currentStatus}`)
            const d = later(rInt * 1000, `${currentIndex + 1}. ${currentCounty}`)
            //const d = reject()
            const finalInput = {
                ...inputBase,
                county: currentCounty,
                index: currentIndex + 1
            }
            const response = axios.post(APIFYURL, finalInput);
            aryPromises.push(response);

        }
    }
    await Promise.allSettled(aryPromises)
        .then(values => {
            values.map(v => {
                let reason = "";
                let countyName = ""
                if (v.status === "rejected") {
                    const dataJson = JSON.parse(v.reason.config.data)
                    reason = v.reason?.response?.data?.error?.message ?? "Actor returned an unexpected error that couldn't be processed";
                    countyName = `${dataJson.index} ${dataJson.county}`
                }
                else {
                    //console.log(v.value);
                    const dataJson = JSON.parse(v.value.config.data)
                    countyName = `${dataJson.index} ${dataJson.county}`
                    reason = "Done"
                }
                const outputStr = `${countyName} - (${reason})`;
                console.log(outputStr)
            })
        })

}

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
