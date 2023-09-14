const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const statusMatrix = ["sale", "isRecentlySold"];
const timeMatrix = ["7", "30", "90", "6m", "12m", "24m", "36m"];
const lotSize = ["1000", "43560", "87120", "217800", "435600", "871200", "2178000", "4356000", ""]

const baseInput = {
    isApartment: false,
    isCondo: false,
    isLotLand: true,
    isMultiFamily: false,
    isSingleFamily: false,
    isTownHouse: false
}

let json = [];



readline.question('Enter a county name: ', name => {

    statusMatrix.map(status => {
        timeMatrix.map(time => {
            for (i = 0; i < (lotSize.length - 1) ; i++) {
                const lot = {
                    minLotSize: lotSize[i],
                    maxLotSize: lotSize[i + 1]
                }
                json = [...json, { ...baseInput, doz: time, status: status, search: name, ...lot }]
            }
            
        })
    })

    readline.close();
});



