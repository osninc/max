import * as cheerio from 'cheerio';
import { processError } from "../../error.js";

export const getMapBoundsFromHtml = body => {
    const $ = cheerio.load(body);

    const findTextAndReturnRemainder = (target, variable) => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length);
        const result = chopFront.substring(0, chopFront.search(";"));
        return result;
    }

    const text = $($('script')).text();
    const findAndClean = findTextAndReturnRemainder(text, "window.mapBounds = ");
    //console.log({ text });
    // console.log({ findAndClean })
    try {
        const result = JSON.parse(findAndClean);
        return result;
    } catch (error) {
        console.log({ text });
        console.log({ findAndClean })
        const l = findTextAndReturnRemainder(text, "var pxCaptchaSrc = ");
        processError("findTextAndReturnRemainder", error);
        throw new Error(l)
    }

}