import { Chip, Divider, List, ListItem, ListItemText } from "@mui/material"

export const WhatsNew = props => {
    return (
        <List dense={true}>
            <Divider component="li"><Chip label="11/7/2023" /></Divider>
            <ListItem>
                <ListItemText
                    primary="Cleaned up the UI"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="New searches will kick off all the searches at once by default. The UI doesn't have to wait until all are done.  If one finishes first, then the user will be able to browse that tab.  User has open to disable which site to search."
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Previous searches will have it's own tab.  Can only load 1 previous dataset per source.  Able to have to different data per source."
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Redfin Data has been merged to match Zillow's acreage and time dimensions.  Noticeable differences is that Redfin has acreage of 20-40 and 40-100 acres, and a time dimension of 5 years."
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Added temporary icons for source searching"
                />
            </ListItem>
            <Divider component="li"><Chip label="11/3/2023" /></Divider>
            <ListItem>
                <ListItemText
                    primary="Support for Redfin data"
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Ability to have both zillow and redfin data at the same time"
                />
            </ListItem>
            <Divider component="li"><Chip label="10/29/2023" /></Divider>
            <ListItem>
                <ListItemText
                    primary="Outseta Integration, added option in debug menu to turn on and off (default OFF for now).  Added buttons to login/signup/profile/signout.  Outseta protected main counts page.  "
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Moved debug menu back up to the top"
                />
            </ListItem>
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