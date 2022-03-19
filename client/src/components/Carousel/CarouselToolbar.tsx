import React from 'react';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
// import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
// import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import { StyledButton } from 'components/common';

// const StyledIconButton = styled(IconButton)(({ theme }) => ({
//   background: 'rgb(59,57,57,0.4)',
//   textTransform: 'none',
//   color: '#f5f5f5',
//   border: `1px solid ${theme.palette.grey[800]}`,
//   fontWeight: 700,
//   // Margin: '1rem',
//   '&:hover': {
//     opacity: 1,
//     backgroundColor: '#424040',
//   },
// }));

const CarouselToolbar = () => (
  <div
    style={{
      backgroundColor: '#242424',
      margin: '0 2rem 1.5rem 1rem',
    }}>
    <Stack direction="row" alignItems="center">
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, flexGrow: 1, color: '#f5f5f5' }}>
        Explore impactful topics
      </Typography>
      <Stack direction="row" spacing={2}>
        <StyledButton sx={{ p: 1 }}>Explore all</StyledButton>
        {/* <StyledIconButton aria-label="previous page" size="medium">
          <ChevronLeftOutlined fontSize="inherit" />
        </StyledIconButton>
        <StyledIconButton aria-label="next page" size="medium">
          <ChevronRightOutlined fontSize="inherit" />
        </StyledIconButton> */}
      </Stack>
    </Stack>
  </div>
);

export default CarouselToolbar;
