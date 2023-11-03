import { ACTORS } from "../constants/constants"
import { sqft2acre } from "../functions/formulas"

const convertAcreageString = str => {
    // String is in the form of sqft-sqft
    if (str === undefined) return ""

    const [acre1, acre2] = str.split("-")
    const a1 = sqft2acre(acre1)
    const a2 = sqft2acre(acre2)
    return `${a1}-${a2}`;

}

const normalizeTime = str => {
    const mapping = {
        "7 days": "1 week",
        "30 days": "1 month",
        "90 days": "3 months",
        "180 days": "6 months"
    }

    return mapping.hasOwnProperty(str) ? mapping[str] : str;
}

const convertSoldInLastText = str => {
    if (!str) return "";
    if (str === "") return "";

    return normalizeTime(str.toLowerCase().replace("last ", ""))
}

const convertDaysOn = str => {
    if (!str) return "";
    if (str === "") return "";

    return normalizeTime(str.toLowerCase().replace("less than ", "").replace("more than ", ""));
}

const renameKeys = (objOfKeys, item) => {
    let returnObj = {}
    Object.keys(objOfKeys).map(key => {
        if (item[key]) {
            returnObj = {
                ...returnObj,
                [objOfKeys[key]]: item[key]
            }
        }
    })

    return returnObj
}

export const fixData = (source, data) => {
    const theSource = ACTORS[source.toUpperCase()].COUNT

    const newData = data.map(item => {
        // Days on
        //const renamedKeys = theSource.RENAMEFIELDS.reduce((obj, field) => (obj[Object.values(field)[0]] = item[Object.keys(field)[0]], obj), {});
        const acreage = theSource.CONVERTACREAGE ? convertAcreageString(item.acreage) : item.acreage
        const renamedKeys = renameKeys(theSource.RENAMEFIELDS, item) // returns an obj

        let modifiedKeys = {}
        if (source === "redfin") {
            modifiedKeys = {
                soldInLast: convertSoldInLastText(item.soldInLast),
                daysOn: convertDaysOn(renamedKeys.daysOn), 
                agentCount: item.count
            }
        }

        return {
            ...item,
            ...renamedKeys,
            ...modifiedKeys,
            acreage,

        }
    })

    //console.log({ newData })

    return newData

}