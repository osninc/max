import fetch from "node-fetch";
import { Actor } from "apify";
import { gotScraping } from "got-scraping";

const proxyConfiguration = await Actor.createProxyConfiguration();
const proxyUrl = await proxyConfiguration.newUrl();
console.log("PROXY URL", proxyUrl);

export async function getSearchPageState(filters) {
  try {
    const url = `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(
      JSON.stringify(filters)
    )}&wants={%22cat1%22:[%22listResults%22,%22mapResults%22],%22cat2%22:[%22total%22]}&requestId=6`;
    const response1 = await gotScraping({
      url,
      proxyUrl,
      responseType: "json",
    });
    return response1.body;

    const res = await fetch(
      `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(
        JSON.stringify(filters)
      )}&wants={%22cat1%22:[%22listResults%22,%22mapResults%22],%22cat2%22:[%22total%22]}&requestId=6`,
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
          "sec-fetch-site": "same-origin",
        },
        referrerPolicy: "unsafe-url",
        body: null,
        method: "GET",
      }
    );
    const data = await res.json();
    return data;
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

export async function getPropertyDetails(zpid) {
  try {
    console.log("getting zpid", zpid);
    let url = `https://www.zillow.com/graphql/?extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22de28fd807dce88b7c1a1cf143315ea6ce5bd52ace222d5d061361c9add70ea33%22%7D%7D&variables=%7B%22zpid%22%3A${zpid}%2C%22contactFormRenderParameter%22%3A%7B%22zpid%22%3A${zpid}%2C%22platform%22%3A%22desktop%22%2C%22isDoubleScroll%22%3Atrue%7D%2C%22skipCFRD%22%3Afalse%7D`;

    const response1 = await gotScraping({
      url,
      proxyUrl,
      responseType: "json",
    });
    return response1?.body?.data?.property;

    const res = await fetch(
      `https://www.zillow.com/graphql/?zpid=${zpid}&contactFormRenderParameter=&queryId=22105174a6535f0d1f2c0a93ac712e96&operationName=ForSaleShopperPlatformFullRenderQuery`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
          accept: "*/*",
          "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
          "client-id": "home-details_fs-sp_bootstrap",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          Referer: "https://www.zillow.com/",
          "Referrer-Policy": "unsafe-url",
        },
        body: `{"operationName":"ForSaleShopperPlatformFullRenderQuery","variables":{"zpid":${zpid},"contactFormRenderParameter":{"zpid":${zpid},"platform":"desktop","isDoubleScroll":true}},"clientVersion":"home-details/6.1.2074.master.783a8d0","queryId":"22105174a6535f0d1f2c0a93ac712e96"}`,
        method: "POST",
      }
    );
    const data = await res.json();
    return data?.data?.property;
  } catch (error) {
    console.log("error at getPropertyDetails: ", error.message);
  }
}

async function getAllPropertyDetails(listings) {
  try {
    const allPropertyDetails = [];

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const propertyDetails = await getPropertyDetails(listing.zpid);
      allPropertyDetails.push(propertyDetails);
    }

    // combine the property details with the search page data
    const combinedData = listings.map((property, index) => {
      const propertyDetails = allPropertyDetails.find(
        (p) => p.zpid == property.zpid // needs to be == because one is a string and the other is a number
      );
      return {
        ...property,
        propertyDetails,
      };
    });
    return combinedData;
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

    return {
      search,
      agentListings,
      otherListings,
      total: agentListings + otherListings,
    };
  } catch (error) {
    console.log("error at doTheEntireGotDamnThing: ", error.message);
  }
}
