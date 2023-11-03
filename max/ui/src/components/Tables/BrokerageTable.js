import { DataGrid } from "@mui/x-data-grid"

import { defaultTheme } from "../../constants/theme"

const consolidateBrokers = data => {
    let brokers = []
    const d = Object.keys(data).filter(el=>el !== "meta").map(acreage => {
        Object.keys(data[acreage]).map(time => {
            //console.log(data[acreage][time])
            brokers = [
                ...brokers,
                ...data[acreage][time]["for sale"].listings.map(listing => listing.broker).filter(el => el),
                ...data[acreage][time]["sold"].listings.map(listing => listing.broker).filter(el => el)
            ]
        })
    })

    // Clean up TODO: make more efficient
    const b = brokers.filter((value, index, array) => {
        return array.findIndex(x => (x.name === value.name) && (x.number === value.number)) === index
    }).filter(el => ((el.name !== null) || (el.number !== null))).map((obj,i) => ({ ...obj, id: i }))
   
    return b
}

export const BrokerageTable = ({ data }) => {
    const columns = [
        { field: "name", headerName: "Brokerage Name", flex: 1 },
        { field: "number", headerName: "Phone", flex: 1 },
        { field: "id4", headerName: "Website", flex: 1 },
        { field: "id2", headerName: "Listings", flex: 1 },
        { field: "id3", headerName: "Sales", flex: 1 }
    ]
    const brokers = consolidateBrokers(data)
    return (
        <DataGrid
            rows={brokers}
            columns={columns}
            initialState={{
                pagination: {
                    paginationModel: {
                        pageSize: 15,
                    },
                },
            }}
            pageSizeOptions={[5, 10, 15, 20]}
            disableRowSelectionOnClick
            density='compact'
            sx={{
                "& .MuiDataGrid-row:hover": {
                    backgroundColor: defaultTheme.palette.primary.light
                    // color: "red"
                }
            }}
        />
    )
}