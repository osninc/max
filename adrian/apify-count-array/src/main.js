import { Actor } from "apify";
import { doTheEntireGotDamnThing } from "./helpers.js";
await Actor.init();

try {
  const { inputs } = await Actor.getInput();
  console.log(`inputs`, inputs);

  const results = await Promise.all(
    inputs.map((input) => doTheEntireGotDamnThing(input))
  );

  await Actor.pushData(results);

  // await Actor.pushData({
  //   agentListings,
  //   otherListings,
  //   total: agentListings + otherListings,
  // });
} catch (error) {
  console.log("Error:", error.message);
} finally {
  // Exit successfully
  await Actor.exit();
}
