import React from 'react';
import { Container, Typography } from '@mui/material';

const OrdersPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        OrdersPage
      </Typography>
      <Typography>Coming soon...</Typography>
    </Container>
  );
};

export default OrdersPage;
