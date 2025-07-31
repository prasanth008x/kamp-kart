import React from 'react';
import { Container, Typography } from '@mui/material';

const ProductDetailPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Product Detail Page
      </Typography>
      <Typography>Coming soon...</Typography>
    </Container>
  );
};

export default ProductDetailPage;