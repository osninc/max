import { Box, Skeleton } from "@mui/material";

export const SkeletonTable = props => {
    return (
        <Box sx={{ width: 300 }}>
            <Skeleton />
            <Skeleton animation="wave" />
            <Skeleton animation={false} />
        </Box>
    )
}