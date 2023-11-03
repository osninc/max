
import PropTypes from "prop-types";
import { Button, ImageList, ImageListItem, ImageListItemBar } from "@mui/material"
import { ThirdPartyIcon } from "../ThirdPartyIcon";
import { srcset } from "../../constants/constants.js";
import { getRealtorUrl } from "../../functions/functions.js";

export const ImagesView = ({ listings, onClick, source }) => {
    return (
        <ImageList sx={{

            height: 600,
        }} rowHeight={200}
            gap={8}
            cols={4}>
            {listings.map((item) => {
                const newImage = item.imgSrc.includes("googleapis.com") ? "/no-image.png" : item.imgSrc;
                return <ImageListItem key={item.zpid} cols={1} rows={1}>
                    <img
                        {...srcset(newImage, 250, 200, 1, 1)}
                        src={newImage}
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
                                href={getRealtorUrl(source, item.zpid, item.url)} rel="noreferrer" target="_blank"
                            >

                                <ThirdPartyIcon site={source} />
                            </Button>
                        }
                    />
                </ImageListItem>
            })}
        </ImageList>
    )

}