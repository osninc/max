import { Actor } from "apify";
import {
  getLocation,
  getPropertyDetails,
  getAllPropertyDetails,
  getSearchPageState,
  doTheEntireGotDamnThing,
} from "./helpers.js";
await Actor.init();

try {
  const { inputs } = await Actor.getInput();

  /**
   {
    "isApartment": false,
    "isCondo": false,
    "isLotLand": false,
    "isManufactured": false,
    "isMultiFamily": true,
    "isSingleFamily": true,
    "isTownhouse": false,
    "search": "Miami, FL",
    "status": "sale"
   }
   */

  console.log("INPUTS", inputs);

  const results = await Promise.all(
    inputs.map((input) => doTheEntireGotDamnThing(input))
  );

  await Actor.pushData(results);
} catch (error) {
  console.log("Error:", error.message);
} finally {
  // Exit successfully
  await Actor.exit();
}
