import { Actor } from "apify";
import {
  getLocation,
  getPropertyDetails,
  getAllPropertyDetails,
  getSearchPageState,
} from "./helpers.js";
await Actor.init();

try {
  const input = await Actor.getInput();
  const {
    search,
    minPrice,
    maxPrice,
    status,
    isSingleFamily,
    doz,
    isCondo,
    isTownhouse,
    isMultiFamily,
    isLotLand,
    isManufactured,
    minLotSize,
    isApartment,
    maxLotSize,
  } = input;

  const locations = await getLocation(search);

  if (locations?.length === 0) {
    throw new Error("No locations found");
  }

  const location = locations?.[0];

  const { lat, lng, regionId } = location?.metaData;

  // counties are regionType 4
  // cities are regionType 6

  const north = lat + 10;
  const south = lat - 10;
  const east = lng + 10;
  const west = lng - 10;

  console.log("north", north);
  console.log("south", south);
  console.log("east", east);
  console.log("west", west);

  const filters = {
    usersSearchTerm: input?.search,
    mapBounds: {
      west,
      east,
      south,
      north,
    },
    regionSelection: [
      {
        regionId: regionId,
        regionType: 6,
      },
    ],
    isMapVisible: true,
    filterState: {
      sortSelection: { value: "globalrelevanceex" },
      isSingleFamily: { value: isSingleFamily },
      isTownhouse: { value: isTownhouse },
      isMultiFamily: { value: isMultiFamily },
      isCondo: { value: isCondo },
      isLotLand: { value: isLotLand },
      isApartment: { value: isApartment },
      isManufactured: { value: isManufactured },
      isApartmentOrCondo: { value: isCondo },
    },
    isListVisible: true,
    category: "cat1",
    pagination: { currentPage: 1 },
  };

  if (minLotSize) {
    filters.filterState.lotSize = { min: Number(minLotSize) };
  }
  if (maxLotSize) {
    filters.filterState.lotSize = { max: Number(maxLotSize) };
  }
  if (minLotSize && maxLotSize) {
    filters.filterState.lotSize = {
      min: Number(minLotSize),
      max: Number(maxLotSize),
    };
  }
  if (minPrice) {
    filters.filterState.price = { min: minPrice };
  }
  if (maxPrice) {
    filters.filterState.price = { max: maxPrice };
  }
  if (minPrice && maxPrice) {
    filters.filterState.price = { min: minPrice, max: maxPrice };
  }
  if (doz) {
    filters.filterState.doz = { value: doz };
  }

  switch (status) {
    case "sale":
      // don't need to do anything
      break;
    case "isForRent":
      filters.filterState.isForRent = { value: true };
      filters.filterState.isForSaleByAgent = { value: false };
      filters.filterState.isForSaleByOwner = { value: false };
      filters.filterState.isNewConstruction = { value: false };
      filters.filterState.isComingSoon = { value: false };
      filters.filterState.isAuction = { value: false };
      filters.filterState.isForSaleForeclosure = { value: false };
      break;
    case "isRecentlySold":
      filters.filterState.isForSaleByAgent = { value: false };
      filters.filterState.isForSaleByOwner = { value: false };
      filters.filterState.isNewConstruction = { value: false };
      filters.filterState.isComingSoon = { value: false };
      filters.filterState.isAuction = { value: false };
      filters.filterState.isForSaleForeclosure = { value: false };
      filters.filterState.isRecentlySold = { value: true };
      break;
  }

  console.log(filters);

  const searchRes = await getSearchPageState(filters);
  const agentListings = searchRes?.categoryTotals?.cat1?.totalResultCount;
  const otherListings = searchRes?.categoryTotals?.cat2?.totalResultCount;

  await Actor.pushData({
    agentListings,
    otherListings,
    total: agentListings + otherListings,
  });
} catch (error) {
  console.log("Error:", error.message);
} finally {
  // Exit successfully
  await Actor.exit();
}
