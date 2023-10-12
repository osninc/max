import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { Avatar, Link, List, ListItem, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from "@mui/material"
import { USDollar } from "../functions/functions.js"

export const PriceHistory = ({ history }) => {
    //console.log({ history })
    return (
        <List
            subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                    Price History
                </ListSubheader>
            }
        >

            {history.map(list => (
                <ListItem key={`${list.date}${list.time}${list.event}`}>
                    {(list.sellerAgent?.photo?.url) ? (
                        <ListItemAvatar>
                            {list.sellerAgent?.profileUrl ? (
                                <Link href={`https://www.zillow.com/${list.sellerAgent.profileUrl}`} rel="noreferrer" target="_blank">
                                    <Avatar src={list.sellerAgent.photo.url} />
                                </Link>
                            ) : (
                                    <Avatar src={list.sellerAgent.photo.url} />
                            )}
                        </ListItemAvatar>
                    ) : (
                        <ListItemIcon>
                            <FontAwesomeIcon icon={icon({ name: 'dollar-sign' })} fixedWidth />
                        </ListItemIcon>
                    )}
                    <ListItemText primary={`${list.date} - ${list.event}`} secondary={USDollar.format(list.price)} />
                </ListItem>
            ))}
        </List>
    )
}