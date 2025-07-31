import React from 'react';
import { Container, Typography } from '@mui/material';

const CartPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        CartPage
      </Typography>
      <Typography>Coming soon...</Typography>
    </Container>
  );
};

export default CartPage;
