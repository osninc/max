import { Chip, Divider, List, ListItem, ListItemText } from "@mui/material"

export const WhatsNew = props => {
    return (
        <List dense={true}>
            <Divider component="li"><Chip label="10/28/2023" /></Divider>
            <ListItem>
                <ListItemText
                    primary="Support for new inputs for builds 0.1.x in the Debug Menu"
                />
            </ListItem>
            <Divider component="li"><Chip label="10/26/2023" /></Divider>
            <ListItem>
                <ListItemText
                    primary="Dataset Dropdown: Added a checkmark next to runs that has details associated with them"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Dataset Dropdown: Removed datasetId and build number"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Main Search: If area has been searched within the last 7 days, then it will find that dataset and load it instead of launching a brand new counts search"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Property Details: If details are available, clicking to view details will get data from the dataset.  Otherwise it will launch the actor with it's fallback going to a test record"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Property Details: On new searches or datasets without a corresponding detail dataset, clicking `search` or `get dataset` will launch the actor to get details dataset.  This is done in the background so I haven't found a way to let the UI know it's finished successfully.  Currently OFF"
                />
            </ListItem>
        </List>
    )
}