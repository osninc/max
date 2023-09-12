import { Actor } from "apify";
import {
  getLocation,
  getAllPropertyDetails,
  getSearchPageState,
  searchGoogleMapsAPI,
  createCoordinateGrid,
  okThisIsTheZillowSearch,
  testSearch,
} from "./helpers.js";
await Actor.init();

try {
  const googleRes = await searchGoogleMapsAPI("San Diego County");
  const viewport = googleRes?.results?.[0]?.geometry?.viewport;
  const promises = [];

  const grid = createCoordinateGrid(viewport, 10);
  for (let i = 0; i < grid.length; i++) {
    const cords = grid[i];
    const { latitudeMax, latitudeMin, longitudeMax, longitudeMin } = cords;
    promises.push(
      testSearch({
        latitudeMax,
        latitudeMin,
        longitudeMax,
        longitudeMin,
      })
    );
  }

  console.log("promises", promises.length);
  let allresults = await Promise.all(promises);
  console.log("allresults", allresults.length);
  allresults = allresults.flat();

  const unique = allresults
    .filter((f) => f?.zpid)
    .filter((v, i, a) => a.findIndex((t) => t.zpid === v.zpid) === i);

  console.log("unique", unique.length);

  const propertyDetails = await getAllPropertyDetails(unique);

  await Actor.pushData(propertyDetails);

  // const input = await Actor.getInput();
  // const {
  //   search,
  //   minPrice,
  //   maxPrice,
  //   status,
  //   isSingleFamily,
  //   doz,
  //   isCondo,
  //   isTownhouse,
  //   isMultiFamily,
  //   isLotLand,
  //   isManufactured,
  //   minLotSize,
  //   isApartment,
  //   maxLotSize,
  // } = input;

  // // GETTING LOCATION
  // const locations = await getLocation(search);
  // if (locations?.length === 0) {
  //   throw new Error("No locations found");
  // }
  // const location = locations?.[0];
  // const { regionId } = location?.metaData;
  // console.log("regionId", regionId);

  // const googleRes = await searchGoogleMapsAPI(search);
  // const viewport = googleRes?.results?.[0]?.geometry?.viewport;
  // const grid = createCoordinateGrid(viewport, 10);
  // // TODO: need new lats and longs

  // // counties are regionType 4
  // // cities are regionType 6

  // // SETTING UP THE FILTERS

  // const searchQueryState = {
  //   usersSearchTerm: input?.search,
  //   mapBounds: {},
  //   mapZoom: 13,
  //   regionSelection: [
  //     {
  //       regionId: regionId,
  //       regionType: 4, // TODO: ??
  //     },
  //   ],
  //   isMapVisible: true,
  //   filterState: {
  //     sortSelection: { value: "globalrelevanceex" },
  //     isSingleFamily: { value: isSingleFamily },
  //     isTownhouse: { value: isTownhouse },
  //     isMultiFamily: { value: isMultiFamily },
  //     isCondo: { value: isCondo },
  //     isLotLand: { value: isLotLand },
  //     isApartment: { value: isApartment },
  //     isManufactured: { value: isManufactured },
  //     isApartmentOrCondo: { value: isCondo },
  //   },
  //   isListVisible: true,
  //   category: "cat1",
  //   pagination: {},
  // };

  // if (minLotSize) {
  //   searchQueryState.filterState.lotSize = { min: Number(minLotSize) };
  // }
  // if (maxLotSize) {
  //   searchQueryState.filterState.lotSize = { max: Number(maxLotSize) };
  // }
  // if (minLotSize && maxLotSize) {
  //   searchQueryState.filterState.lotSize = {
  //     min: Number(minLotSize),
  //     max: Number(maxLotSize),
  //   };
  // }
  // if (minPrice) {
  //   searchQueryState.filterState.price = { min: minPrice };
  // }
  // if (maxPrice) {
  //   searchQueryState.filterState.price = { max: maxPrice };
  // }
  // if (minPrice && maxPrice) {
  //   searchQueryState.filterState.price = { min: minPrice, max: maxPrice };
  // }
  // if (doz) {
  //   searchQueryState.filterState.doz = { value: doz };
  // }

  // switch (status) {
  //   case "sale":
  //     // don't need to do anything
  //     break;
  //   case "isForRent":
  //     searchQueryState.filterState.isForRent = { value: true };
  //     searchQueryState.filterState.isForSaleByAgent = { value: false };
  //     searchQueryState.filterState.isForSaleByOwner = { value: false };
  //     searchQueryState.filterState.isNewConstruction = { value: false };
  //     searchQueryState.filterState.isComingSoon = { value: false };
  //     searchQueryState.filterState.isAuction = { value: false };
  //     searchQueryState.filterState.isForSaleForeclosure = { value: false };
  //     break;
  //   case "isRecentlySold":
  //     searchQueryState.filterState.isForSaleByAgent = { value: false };
  //     searchQueryState.filterState.isForSaleByOwner = { value: false };
  //     searchQueryState.filterState.isNewConstruction = { value: false };
  //     searchQueryState.filterState.isComingSoon = { value: false };
  //     searchQueryState.filterState.isAuction = { value: false };
  //     searchQueryState.filterState.isForSaleForeclosure = { value: false };
  //     searchQueryState.filterState.isRecentlySold = { value: true };
  //     break;
  // }

  // console.log(searchQueryState);

  // const promises = [];

  // // GETTING THE SEARCH RESULTS
  // for (let i = 0; i < grid.length; i++) {
  //   const { latitudeMax, latitudeMin, longitudeMax, longitudeMin } = grid[i];
  //   searchQueryState.mapBounds = {
  //     north: latitudeMax,
  //     south: latitudeMin,
  //     east: longitudeMax,
  //     west: longitudeMin,
  //   };
  //   promises.push(okThisIsTheZillowSearch(searchQueryState));
  // }

  // let allSearchResults = await Promise.all(promises);
  // allSearchResults = allSearchResults.flat();

  // // GETTING THE PROPERTY DETAILS

  // const allListings = await getAllPropertyDetails(allSearchResults);

  // console.log("allListings.length", allListings.length);
  // // console.log("agentListings", agentListings);
  // // console.log("otherListings", otherListings);

  // await Actor.pushData(allListings);
} catch (error) {
  console.log("Error:", error.message);
} finally {
  // Exit successfully
  await Actor.exit();
}
