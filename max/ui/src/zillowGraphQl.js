export const getPropertyParams = (zpid) => {
    const clientVersion = 'home-details/6.0.11.1315.master.2fc8ca5';
    const timePeriod = 'FIVE_YEARS';
    const metricType = 'LOCAL_HOME_VALUES';
    const forecast = true;

    return {
        query: 'query PriceTaxQuery($zpid: ID!) {\
        property(zpid: $zpid) {\
          address {\
            city\
            state\
            streetAddress\
            zipcode\
          }\
          dateSold\
          hdpUrl\
          homeStatus\
          lastSoldPrice\
          latitude\
          longitude\
          lotSize\
          price\
          priceHistory {\
            date\
            time\
            price\
            event\
            buyerAgent {\
              photo{\
                url\
              }\
              profileUrl\
              name\
            }\
            sellerAgent {\
              photo{\
                url\
              }\
              profileUrl\
              name\
            }\
          }\
          yearBuilt\
          zestimate\
          zpid\
          lotAreaValue\
          lotAreaUnits\
          timeOnZillow\
          pageViewCount\
          favoriteCount\
          daysOnZillow\
          description\
          brokerId\
          brokerageName\
          mlsid\
          monthlyHoaFee\
          resoFacts {\
            parcelNumber\
          }\
          attributionInfo {\
            mlsName\
            agentEmail\
            agentLicenseNumber\
            agentName\
            agentPhoneNumber\
            attributionTitle\
            brokerName\
            brokerPhoneNumber\
            buyerAgentMemberStateLicense\
            buyerAgentName\
            buyerBrokerageName\
            coAgentLicenseNumber\
            coAgentName\
	          coAgentNumber\
            mlsId\
          }\
        }\
      }\
        ',
        operationName: 'PriceTaxQuery',
        variables: {
            zpid: zpid,
            timePeriod: timePeriod,
            metricType: metricType,
            forecast: forecast,
        },
        clientVersion: clientVersion,
    };
};
