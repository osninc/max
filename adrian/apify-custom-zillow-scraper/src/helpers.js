import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";
import { Actor } from "apify";
import { gotScraping } from "got-scraping";
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda"; // ES Modules import
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const proxyConfiguration = await Actor.createProxyConfiguration();

export async function getSearchPageState(filters) {
  try {
    console.log("filters", filters.pagination);
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
    if (filters.pagination.currentPage !== 1) {
      console.log("res", res);
    }
    const data = await res.json();
    console.log("data", data?.cat1?.searchResults?.listResults?.length);
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

async function getPropertyDetails(listing) {
  try {
    const proxyUrl = await proxyConfiguration.newUrl();
    if (!listing?.zpid) {
      return null;
    }
    let url = `https://www.zillow.com/graphql/?extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22de28fd807dce88b7c1a1cf143315ea6ce5bd52ace222d5d061361c9add70ea33%22%7D%7D&variables=%7B%22zpid%22%3A${listing?.zpid}%2C%22contactFormRenderParameter%22%3A%7B%22zpid%22%3A${listing?.zpid}%2C%22platform%22%3A%22desktop%22%2C%22isDoubleScroll%22%3Atrue%7D%2C%22skipCFRD%22%3Afalse%7D`;

    const response1 = await gotScraping({
      url,
      proxyUrl,
      responseType: "json",
    });
    const property = response1?.body?.data?.property;
    return {
      zpid: property?.zpid,
      imgSrc: property?.hiResImageLink,
      detailUrl: `https://www.zillow.com${property?.hdpUrl}`,
      statusText: property?.homeStatus,
      unformattedPrice: property?.price,
      address: `${property?.streetAddress} ${property?.regionString}`,
      addressStreet: property?.streetAddress,
      addressCity: property?.address?.city,
      addressState: property?.address?.state,
      addressZipcode: property?.address?.zipcode,
      lotAreaString: property?.resoFacts?.lotSize,
      beds: property?.bedrooms,
      baths: property?.bathrooms,
      area: property?.livingAreaUnits,
      // latLong,
      // type: variableData?.type,
      // variableDataText: variableData?.text,
      // dateSold: hdpData?.homeInfo?.dateSold,
      lotAreaValue: property?.lotAreaValue,
      lotAreaUnit: property?.lotAreaUnits,
      brokerName: property?.attributionInfo?.brokerName,
      is_pending: property?.listing_sub_type?.is_pending,
      parcelNumber: property?.resoFacts?.parcelNumber,
      mlsName: property?.attributionInfo?.mlsName,
      agentEmail: property?.attributionInfo?.agentEmail,
      agentLicenseNumber: property?.attributionInfo?.agentLicenseNumber,
      agentName: property?.attributionInfo?.agentName,
      agentPhoneNumber: property?.attributionInfo?.agentPhoneNumber,
      attributionTitle: property?.attributionInfo?.attributionTitle,
      brokerName: property?.attributionInfo?.brokerName,
      brokerPhoneNumber: property?.attributionInfo?.brokerPhoneNumber,
      buyerAgentMemberStateLicense:
        property?.attributionInfo?.buyerAgentMemberStateLicense,
      buyerAgentName: property?.attributionInfo?.buyerAgentName,
      buyerBrokerageName: property?.attributionInfo?.buyerBrokerageName,
      coAgentLicenseNumber: property?.attributionInfo?.coAgentLicenseNumber,
      coAgentName: property?.attributionInfo?.coAgentName,
      mlsId: property?.attributionInfo?.mlsId,
      priceHistory: property?.priceHistory.map((price) => ({
        date: price.date,
        time: price.time,
        price: price.price,
        pricePerSquareFoot: price.pricePerSquareFoot,
        priceChangeRate: price.priceChangeRate,
        event: price.event,
      })),
      description: property?.description,
      timeOnZillow: property?.timeOnZillow,
      pageViewCount: property?.pageViewCount,
      favoriteCount: property?.favoriteCount,
      daysOnZillow: property?.daysOnZillow,
      latitude: property?.latitude,
      longitude: property?.longitude,
      monthlyHoaFee: property?.monthlyHoaFee,
      lotSize: property?.lotSize,
      lotAreaValue: property?.lotAreaValue,
      lotAreaUnits: property?.lotAreaUnits,
    };
  } catch (error) {
    console.log("error at fetchZillowProperty: ", error.message);
  }
}

export async function getAllPropertyDetails(listings) {
  try {
    // const allPropertyDetails = [];
    let batch = [];

    const allPropertyDetails = await Promise.all(
      listings.map((listing) => getPropertyDetails(listing))
    );

    // for (let i = 0; i < listings.length; i++) {
    //   const listing = listings[i];
    //   batch.push(listing);
    //   if (batch.length === 100) {
    //     const propertyDetails = await Promise.all(
    //       batch.map((listing) => getPropertyDetails(listing.zpid))
    //     );
    //     allPropertyDetails.push(...propertyDetails);
    //     batch = [];
    //   }
    // }
    // if (batch.length > 0) {
    //   const propertyDetails = await Promise.all(
    //     batch.map((listing) => getPropertyDetails(listing.zpid))
    //   );
    //   allPropertyDetails.push(...propertyDetails);
    // }
    console.log("done getting listings");

    const allListings = allPropertyDetails.filter((listing) => listing?.zpid);
    return allListings;
  } catch (error) {
    console.log("error at getAllPropertyDetails: ", error.message);
  }
}

export async function searchGoogleMapsAPI(query) {
  try {
    console.log("process.env.GOOGLE_API_KEY", process.env.GOOGLE_API_KEY);
    const res = await axios({
      method: "get",
      url: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=AIzaSyChuRWb9cBUiwHutYkVIEiLBc-0WFcWoNw`, // TODO: here
    });
    return res?.data;
  } catch (error) {
    console.log("error at searchGoogleMapsAPI", error.message);
  }
}

export function createCoordinateGrid(viewport, gridSize = 2) {
  const { northeast, southwest } = viewport;

  const latitudeRange = northeast.lat - southwest.lat;
  const longitudeRange = northeast.lng - southwest.lng;

  const grid = [];

  for (
    let lat = southwest.lat;
    lat < northeast.lat;
    lat += latitudeRange / gridSize
  ) {
    for (
      let lng = southwest.lng;
      lng < northeast.lng;
      lng += longitudeRange / gridSize
    ) {
      const cell = {
        latitudeMax: lat + latitudeRange / gridSize,
        latitudeMin: lat,
        longitudeMax: lng + longitudeRange / gridSize,
        longitudeMin: lng,
      };
      grid.push(cell);
    }
  }

  return grid;
}

export function getProxyAgent() {
  const ips = [
    `216.10.3.184`,
    `194.61.31.203`,
    `181.177.75.155`,
    `178.212.35.117`,
    `178.212.35.243`,
    `181.177.65.223`,
    `185.205.197.143`,
    `181.177.78.80`,
    `181.177.77.62`,
    `141.98.154.78`,
    `2.58.83.68`,
    `181.177.69.171`,
    `181.177.77.56`,
    `95.214.219.242`,
    `216.10.0.189`,
    `80.65.208.98`,
    `195.7.4.233`,
    `104.239.114.166`,
    `195.200.215.103`,
    `181.177.74.118`,
    `91.205.104.29`,
    `141.98.152.86`,
    `185.207.97.205`,
    `193.22.147.220`,
    `185.193.74.123`,
    `195.7.5.179`,
    `181.177.75.226`,
    `141.98.152.20`,
    `185.195.212.231`,
    `178.212.35.13`,
  ];

  const ip = ips[Math.floor(Math.random() * ips.length)];

  return `http://michael_horning-9ntej:IDqA1T5l9N@${ip}:3199`;

  // const proxyAgent = new HttpsProxyAgent({
  //   host: ips[Math.floor(Math.random() * ips.length)],
  //   port: 3199,
  //   auth: `michael_horning-9ntej:IDqA1T5l9N`,
  // });
  // return proxyAgent;
}

// export async function okThisIsTheZillowSearch(searchQueryState) { // TODO: uncomment
export async function okThisIsTheZillowSearch(blah) {
  try {
    const proxyUrl = await proxyConfiguration.newUrl();

    const searchQueryState = {
      pagination: {},
      usersSearchTerm: "San Diego County, CA",
      mapBounds: {
        north: blah.mapBounds.north,
        south: blah.mapBounds.south,
        east: blah.mapBounds.east,
        west: blah.mapBounds.west,
      },
      regionSelection: [{ regionId: 2841, regionType: 4 }],
      isMapVisible: true,
      filterState: {
        sortSelection: { value: "globalrelevanceex" },
        isAllHomes: { value: true },
      },
      isListVisible: true,
    };

    const requestId = 8;
    const proxy = getProxyAgent();
    console.log("proxy", proxy);
    const res = await gotScraping({
      url: `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(
        JSON.stringify(searchQueryState)
      )}&wants={%22cat1%22:[%22listResults%22,%22mapResults%22],%22cat2%22:[%22total%22]}&requestId=${requestId}`,
      proxyUrl: proxy,
      responseType: "json",
    });
    console.log("res", res.statusCode);
    const json = res.body;
    // const json = await res.json();
    const totalResults = json?.categoryTotals?.cat1?.totalResultCount;
    console.log("totalResults", totalResults);
    const mapResults = json?.cat1?.searchResults?.mapResults;
    return mapResults;
  } catch (error) {
    console.log("error at okThisIsTheZillowSearch: ", error.message);
  }
}

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);

export async function testSearch({
  latitudeMax,
  latitudeMin,
  longitudeMax,
  longitudeMin,
}) {
  try {
    const proxyUrl = await proxyConfiguration.newUrl();
    const searchQueryState = {
      pagination: {},
      usersSearchTerm: "San Diego County, CA",
      mapBounds: {
        north: latitudeMax,
        south: latitudeMin,
        east: longitudeMax,
        west: longitudeMin,
      },
      regionSelection: [{ regionId: 2841, regionType: 4 }],
      isMapVisible: true,
      filterState: {
        sortSelection: { value: "globalrelevanceex" },
        isAllHomes: { value: true },
      },
      isListVisible: true,
    };
    const requestId = 8;
    const proxy = getProxyAgent();
    const res = await gotScraping({
      url: `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(
        JSON.stringify(searchQueryState)
      )}&wants={%22cat1%22:[%22listResults%22,%22mapResults%22],%22cat2%22:[%22total%22]}&requestId=${requestId}`,
      proxyUrl,
      responseType: "json",
    });
    // const json = await res.json();
    const json = res.body;
    const totalResults = json?.categoryTotals?.cat1?.totalResultCount;
    console.log("totalResults", totalResults);
    const mapResults = json?.cat1?.searchResults?.mapResults;
    return mapResults;
  } catch (error) {
    console.log("error at testSearch: ", error.message);
    return [];
  }
}
