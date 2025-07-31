import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  Rating,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  rating: { average: number; count: number };
  category: string;
  brand: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products/featured/all?limit=8`),
        axios.get(`${API_URL}/products/categories/all`)
      ]);
      
      setFeaturedProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const categoryIcons: { [key: string]: string } = {
    mobile: '📱',
    laptops: '💻',
    headphones: '🎧',
    electronics: '⚡',
    fashion: '👗',
    men: '👔',
    women: '👚',
    shoes: '👟',
    watches: '⌚',
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          py: 8,
          px: 4,
          mb: 6,
          background: 'linear-gradient(135deg, #e91e63 0%, #ff9800 100%)',
          color: 'white',
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Welcome to Kamp Kart
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ opacity: 0.9 }}>
          Your one-stop shop for everything you need
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
          Discover amazing products with fast delivery and great prices
        </Typography>
        <Button
          variant="contained"
          size="large"
          color="secondary"
          onClick={() => navigate('/products')}
          sx={{ mt: 2, px: 4, py: 1.5 }}
        >
          Start Shopping
        </Button>
      </Paper>

      {/* Categories Section */}
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Shop by Category
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {categories.slice(0, 8).map((category) => (
          <Grid item xs={6} sm={4} md={3} key={category._id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(`/category/${category._id}`)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {categoryIcons[category._id] || '🛍️'}
                </Typography>
                <Typography variant="h6" fontWeight="bold" textTransform="capitalize">
                  {category._id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.count} products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Featured Products */}
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Featured Products
      </Typography>
      <Grid container spacing={3}>
        {featuredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.images[0] || '/placeholder.jpg'}
                  alt={product.name}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${product._id}`)}
                />
                {product.discount && (
                  <Chip
                    icon={<OfferIcon />}
                    label={`${product.discount}% OFF`}
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 'bold',
                    }}
                  />
                )}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { backgroundColor: 'white' },
                  }}
                  size="small"
                >
                  <FavoriteIcon />
                </IconButton>
              </Box>
              
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {product.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {product.brand}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={product.rating.average} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({product.rating.count})
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ₹{product.price.toLocaleString()}
                  </Typography>
                  {product.originalPrice && (
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: 'line-through',
                        color: 'text.secondary',
                        ml: 1,
                      }}
                    >
                      ₹{product.originalPrice.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CartIcon />}
                  onClick={() => handleAddToCart(product._id)}
                  sx={{ fontWeight: 'bold' }}
                >
                  Add to Cart
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/products')}
          sx={{ px: 4, py: 1.5 }}
        >
          View All Products
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;