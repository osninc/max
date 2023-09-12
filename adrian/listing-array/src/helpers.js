import fetch from "node-fetch";
import { Actor } from "apify";
import { gotScraping } from "got-scraping";
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda"; // ES Modules import
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const client = new LambdaClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ["RESIDENTIAL"],
});
const proxyUrl = await proxyConfiguration.newUrl();
console.log("PROXY URL", proxyUrl);

export async function getSearchPageState(filters) {
  try {
    console.log("filters", filters.pagination);
    let url = `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(
      JSON.stringify(filters)
    )}&wants={%22cat1%22:[%22listResults%22,%22mapResults%22],%22cat2%22:[%22total%22]}&requestId=6`;

    const response1 = await gotScraping({
      url,
      proxyUrl,
      responseType: "json",
      timeout: {
        request: 10000,
      },
    });
    console.log("response1", response1.body);
    return response1.body;
  } catch (error) {
    console.log("error at getSearchPageState", error.message);
  }
}

export async function getLocation(location) {
  try {
    if (!location) {
      throw new Error("No location provided");
    }

    const res = await fetch(
      `https://www.zillowstatic.com/autocomplete/v3/suggestions?q=${encodeURIComponent(
        location
      )}&abKey=ee2e7f10-820f-4042-af3f-68dcd85a7ae0&clientId=static-search-page`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
          accept: "*/*",
          "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
          "sec-ch-ua":
            '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          Referer:
            "https://www.zillow.com/homes/for_sale/?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22mapBounds%22%3A%7B%22west%22%3A-97.83196449279785%2C%22east%22%3A-97.6311206817627%2C%22south%22%3A30.25098596475651%2C%22north%22%3A30.291311394549737%7D%2C%22mapZoom%22%3A13%2C%22isMapVisible%22%3Atrue%2C%22filterState%22%3A%7B%22con%22%3A%7B%22value%22%3Afalse%7D%2C%22apa%22%3A%7B%22value%22%3Afalse%7D%2C%22mf%22%3A%7B%22value%22%3Afalse%7D%2C%22ah%22%3A%7B%22value%22%3Atrue%7D%2C%22sort%22%3A%7B%22value%22%3A%22globalrelevanceex%22%7D%2C%22lot%22%3A%7B%22min%22%3A1000%2C%22max%22%3A4356000%7D%2C%22sf%22%3A%7B%22value%22%3Afalse%7D%2C%22tow%22%3A%7B%22value%22%3Afalse%7D%2C%22manu%22%3A%7B%22value%22%3Afalse%7D%2C%22apco%22%3A%7B%22value%22%3Afalse%7D%7D%2C%22isListVisible%22%3Atrue%7D",
          "Referrer-Policy": "unsafe-url",
        },
        body: null,
        method: "GET",
      }
    );
    const data = await res.json();
    return data?.results;
  } catch (error) {
    console.log("error at getLocation: ", error.message);
  }
}

export async function getPropertyDetails(zillowListing) {
  try {
    if (!zillowListing?.zpid) {
      return null;
    }
    const zpid = zillowListing?.zpid;
    let url = `https://www.zillow.com/graphql/?extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22de28fd807dce88b7c1a1cf143315ea6ce5bd52ace222d5d061361c9add70ea33%22%7D%7D&variables=%7B%22zpid%22%3A${zpid}%2C%22contactFormRenderParameter%22%3A%7B%22zpid%22%3A${zpid}%2C%22platform%22%3A%22desktop%22%2C%22isDoubleScroll%22%3Atrue%7D%2C%22skipCFRD%22%3Afalse%7D`;

    const response1 = await gotScraping({
      url,
      proxyUrl,
      responseType: "json",
      timeout: {
        request: 10000,
      },
    });
    const propertyDetails = response1?.body?.data?.property;
    const {
      imgSrc,
      detailUrl,
      statusText,
      unformattedPrice,
      address,
      addressStreet,
      addressCity,
      addressState,
      addressZipcode,
      lotAreaString,
      beds,
      baths,
      area,
      latLong,
      variableData,
      hdpData,
      brokerName,
    } = zillowListing;
    return {
      zpid: propertyDetails?.zpid,
      imgSrc,
      detailUrl,
      statusText,
      unformattedPrice,
      address,
      addressStreet,
      addressCity,
      addressState,
      addressZipcode,
      lotAreaString,
      beds,
      baths,
      area,
      latLong,
      type: variableData?.type,
      variableDataText: variableData?.text,
      dateSold: hdpData?.homeInfo?.dateSold,
      lotAreaValue: hdpData?.homeInfo?.lotAreaValue,
      lotAreaUnit: hdpData?.homeInfo?.lotAreaUnit,
      brokerName,
      is_pending: propertyDetails?.listing_sub_type?.is_pending,
      parcelNumber: propertyDetails?.resoFacts?.parcelNumber,
      mlsName: propertyDetails?.attributionInfo?.mlsName,
      agentEmail: propertyDetails?.attributionInfo?.agentEmail,
      agentLicenseNumber: propertyDetails?.attributionInfo?.agentLicenseNumber,
      agentName: propertyDetails?.attributionInfo?.agentName,
      agentPhoneNumber: propertyDetails?.attributionInfo?.agentPhoneNumber,
      attributionTitle: propertyDetails?.attributionInfo?.attributionTitle,
      brokerName: propertyDetails?.attributionInfo?.brokerName,
      brokerPhoneNumber: propertyDetails?.attributionInfo?.brokerPhoneNumber,
      buyerAgentMemberStateLicense:
        propertyDetails?.attributionInfo?.buyerAgentMemberStateLicense,
      buyerAgentName: propertyDetails?.attributionInfo?.buyerAgentName,
      buyerBrokerageName: propertyDetails?.attributionInfo?.buyerBrokerageName,
      coAgentLicenseNumber:
        propertyDetails?.attributionInfo?.coAgentLicenseNumber,
      coAgentName: propertyDetails?.attributionInfo?.coAgentName,
      mlsId: propertyDetails?.attributionInfo?.mlsId,
      priceHistory: propertyDetails?.priceHistory.map((price) => ({
        date: price.date,
        time: price.time,
        price: price.price,
        pricePerSquareFoot: price.pricePerSquareFoot,
        priceChangeRate: price.priceChangeRate,
        event: price.event,
      })),
      description: propertyDetails?.description,
      timeOnZillow: propertyDetails?.timeOnZillow,
      pageViewCount: propertyDetails?.pageViewCount,
      favoriteCount: propertyDetails?.favoriteCount,
      daysOnZillow: propertyDetails?.daysOnZillow,
      latitude: propertyDetails?.latitude,
      longitude: propertyDetails?.longitude,
      monthlyHoaFee: propertyDetails?.monthlyHoaFee,
      lotSize: propertyDetails?.lotSize,
      lotAreaValue: propertyDetails?.lotAreaValue,
      lotAreaUnits: propertyDetails?.lotAreaUnits,
    };
  } catch (error) {
    console.log("error at getPropertyDetails: ", error.message);
    console.log(`zpid of error: ${zillowListing?.zpid}`);
    return null;
  }
}

export async function getAllPropertyDetails(listings) {
  try {
    const allPropertyDetails = [];
    let batch = [];

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      batch.push(listing);
      if (batch.length === 100) {
        const propertyDetails = await Promise.all(
          batch.map((listing) => getPropertyDetails(listing))
        );
        allPropertyDetails.push(...propertyDetails);
        batch = [];
      }
    }
    if (batch.length > 0) {
      const propertyDetails = await Promise.all(
        batch.map((listing) => getPropertyDetails(listing.zpid))
      );
      allPropertyDetails.push(...propertyDetails);
    }
    console.log("done getting listings");
    return allPropertyDetails.filter((listing) => listing?.zpid);
  } catch (error) {
    console.log("error at getAllPropertyDetails: ", error.message);
  }
}

export async function doTheEntireGotDamnThing(input) {
  try {
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

    const north = lat + 2;
    const south = lat - 2;
    const east = lng + 2;
    const west = lng - 2;

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

    const allListings = [];

    const searchRes = await getSearchPageState(filters);
    const agentListings = searchRes?.categoryTotals?.cat1?.totalResultCount;
    const otherListings = searchRes?.categoryTotals?.cat2?.totalResultCount;
    const propertySearchData = searchRes?.cat1.searchResults.mapResults;
    console.log("propertySearchData.length", propertySearchData.length);
    console.log("allListings.length", allListings.length);
    console.log("agentListings", agentListings);
    console.log("otherListings", otherListings);
    const allListingsWithDetails = await getAllPropertyDetails(
      propertySearchData
    );
    console.log("allListingsWithDetails.length", allListingsWithDetails.length);

    const slimmed = allListingsWithDetails.map((listing) => {
      return {
        ...listing,
        agentListings,
        otherListings,
      };
    });

    console.log("slimmed", slimmed.length);
    return {
      results: slimmed,
    };
  } catch (error) {
    console.log("error at doTheEntireGotDamnThing: ", error.message);
  }
}
