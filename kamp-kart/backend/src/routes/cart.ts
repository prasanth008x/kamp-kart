import express, { Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .populate({
        path: 'cart.product',
        select: 'name price originalPrice images stock category brand'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate cart totals
    let subtotal = 0;
    const cartItems = user.cart.map(item => {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      return {
        ...item.toObject(),
        itemTotal
      };
    });

    res.json({
      cart: cartItems,
      summary: {
        itemCount: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        shipping: subtotal > 500 ? 0 : 50, // Free shipping above ₹500
        total: subtotal + (subtotal > 500 ? 0 : 50)
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(item => 
      item.product.toString() === productId && 
      item.size === size && 
      item.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({ message: 'Cannot add more items than available stock' });
      }
      
      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        size,
        color,
        addedAt: new Date()
      });
    }

    await user.save();

    // Populate cart for response
    await user.populate({
      path: 'cart.product',
      select: 'name price originalPrice images stock category brand'
    });

    res.json({
      message: 'Item added to cart successfully',
      cart: user.cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item quantity
router.put('/update/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartItem = user.cart.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    cartItem.quantity = quantity;
    await user.save();

    res.json({
      message: 'Cart updated successfully',
      cartItem
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartItem = user.cart.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    user.cart.pull(itemId);
    await user.save();

    res.json({
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Move item to wishlist
router.post('/move-to-wishlist/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartItem = user.cart.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Add to wishlist if not already there
    if (!user.wishlist.includes(cartItem.product)) {
      user.wishlist.push(cartItem.product);
    }

    // Remove from cart
    user.cart.pull(itemId);
    await user.save();

    res.json({
      message: 'Item moved to wishlist successfully'
    });
  } catch (error) {
    console.error('Move to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;