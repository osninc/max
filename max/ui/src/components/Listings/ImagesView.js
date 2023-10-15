
import PropTypes from "prop-types"; 
import { Button, ImageList, ImageListItem, ImageListItemBar } from "@mui/material"
import { ThirdPartyIcon } from "../ThirdPartyIcon";
import { srcset } from "../../constants/constants.js";

export const ImagesView = ({ listings, onClick }) => {
    return (
        <ImageList sx={{

            height: 450,
        }} rowHeight={200}
            gap={8}
            cols={4}>
            {listings.map((item) => (
                <ImageListItem key={item.zpid} cols={1} rows={1}>
                    <img
                        {...srcset(item.image, 250, 200, 1, 1)}
                        src={(item.imgSrc.includes("googleapis.com")) ? "/no-image.png" : item.imgSrc}
                        alt={item.zpid}
                        loading="lazy"
                        onClick={() => onClick(item.zpid)}
                    />

                    <ImageListItemBar
                        title={item.price}
                        subtitle={`${item.streetAddress}, ${item.city}, ${item.state} ${item.zipcode}`}
                        actionIcon={
                            <Button
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                aria-label={`info about ${item.title}`}
                                href={`https://www.zillow.com/homedetails/${item.zpid}_zpid`} rel="noreferrer" target="_blank"
                            >

                                <ThirdPartyIcon site="zillow" />
                            </Button>
                        }
                    />
                </ImageListItem>
            ))}
        </ImageList>
    )

}