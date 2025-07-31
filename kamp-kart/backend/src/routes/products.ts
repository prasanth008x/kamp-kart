import express, { Response } from 'express';
import Product from '../models/Product';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      featured
    } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (brand) filter.brand = new RegExp(brand as string, 'i');
    if (featured === 'true') filter.featured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { tags: new RegExp(search as string, 'i') },
        { brand: new RegExp(search as string, 'i') }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-specifications'),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        category,
        subcategory,
        brand,
        minPrice,
        maxPrice,
        search
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category
router.get('/category/:category', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [products, totalCount] = await Promise.all([
      Product.find({ category, isActive: true })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-specifications'),
      Product.countDocuments({ category, isActive: true })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      products,
      category,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured products
router.get('/featured/all', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(20, Math.max(1, Number(limit)));

    const products = await Product.find({ featured: true, isActive: true })
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(limitNum)
      .select('-specifications');

    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories with product counts
router.get('/categories/all', async (req, res: Response) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search products
router.get('/search/:query', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Text search with scoring
    const [products, totalCount] = await Promise.all([
      Product.find(
        {
          $text: { $search: query },
          isActive: true
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limitNum)
        .select('-specifications'),
      Product.countDocuments({
        $text: { $search: query },
        isActive: true
      })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      products,
      query,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get related products
router.get('/:id/related', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { brand: product.brand },
        { tags: { $in: product.tags } }
      ],
      isActive: true
    })
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(8)
      .select('-specifications');

    res.json({ relatedProducts });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;