import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Typography from '@mui/material/Typography';

const StyledRating = styled(Rating)({
    '& .MuiRating-iconFilled': {
        color: '#ccf900',   // Filled stars
    },
    '& .MuiRating-iconHover': {
        color: '#ccf900',   // Hover state
    },
    '& .MuiRating-iconEmpty': {
        color: '#ccf900',   // Outline (unselected) stars
    },
});

export default function CustomizedRating({ onRatingChange }) {
    const handleChange = (event, newValue) => {
        if (onRatingChange) {
            onRatingChange(newValue);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '& > legend': { mt: 2 }
            }}
        >
            <Typography component="legend">How did you like this round?</Typography>
            <StyledRating
                name="customized-color"
                defaultValue={0}
                getLabelText={(value) => `${value} Heart${value !== 1 ? 's' : ''}`}
                precision={0.5}
                onChange={handleChange}
                size="large"
            />

        </Box>
    );
}
