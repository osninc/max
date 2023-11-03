import { ACTORS, APIFY } from "../constants/constants"

export const buildApifyUrl = (source, main, type, id) => {
   // console.log(source, main, type, id)
    let theActor;
    if (source !== "")
        theActor = ACTORS[source.toUpperCase()][main.toUpperCase()];
    let endPoint = `${APIFY.BASEURL}${APIFY.ENDPOINTS[type.toUpperCase()]}&token=${APIFY.TOKEN}&status=SUCCEEDED`
        .replace("<STOREID>", id)
        .replace("<DATASETID>", id)

    if (theActor)
        endPoint = endPoint.replace("<ACTORID>", theActor["ID"]).replace("<BUILD>",theActor["BUILD"])
    return endPoint
}