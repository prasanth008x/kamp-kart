import React from 'react';
import { Container, Typography } from '@mui/material';

const ProductsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Products Page
      </Typography>
      <Typography>Coming soon...</Typography>
    </Container>
  );
};

export default ProductsPage;