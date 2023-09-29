// Get my test data
import testLarge from "../test_data/test_san_diego_page1.json" assert {type: "json"};
import testRegion from "../test_data/test_san_diego_region.json" assert {type: "json"};
import testCounts from "../test_data/dataset_maxeverythingcount_2023-09-23_19-03-24-717.json" assert { type: "json" }

export const getTestRegion = (regionType) => {

    const offset = 10;

    const lat = testRegion.results[0].metaData.lat;
    const lng = testRegion.results[0].metaData.lng;
    const regionId = testRegion.results[0].metaData.regionId;
    return {
        mapBounds: {
            north: lat + offset,
            south: lat - offset,
            west: lng - offset,
            east: lng + offset
        },
        regionSelection: [
            {
                regionId,
                regionType
            }
        ]
    }
}

export const getTestData = () => {
    return testLarge;
}