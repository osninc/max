import { Box, CircularProgress, Typography } from "@mui/material"
import Timer from "../Timer.js"

export const CircularProgressTimer = ({ onUpdate }) => {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    <Timer start onUpdate={(s) => onUpdate(s)} />
                </Typography>
            </Box>
        </Box>
    )
}