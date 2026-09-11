import { Router, Request, Response } from 'express';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products for authenticated user
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, category_id, warehouse_id, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM products WHERE user_id = $1';
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR barcode ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (warehouse_id) {
      sql += ` AND warehouse_id = $${paramIndex}`;
      params.push(warehouse_id);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku]
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               category_id:
 *                 type: string
 *               warehouse_id:
 *                 type: string
 *               unit:
 *                 type: string
 *                 default: pcs
 *               purchase_price:
 *                 type: number
 *               sale_price:
 *                 type: number
 *               minimum_stock:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      barcode,
      category_id,
      warehouse_id,
      unit = 'pcs',
      purchase_price = 0,
      sale_price = 0,
      minimum_stock = 0,
      description,
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Name and SKU are required',
      });
    }

    const productId = uuidv4();

    await query(
      `INSERT INTO products
       (id, user_id, name, sku, barcode, category_id, warehouse_id, unit, purchase_price, sale_price, minimum_stock, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        productId,
        req.userId,
        name,
        sku,
        barcode,
        category_id,
        warehouse_id,
        unit,
        purchase_price,
        sale_price,
        minimum_stock,
        description,
      ]
    );

    const result = await query('SELECT * FROM products WHERE id = $1', [productId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a specific product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      barcode,
      category_id,
      warehouse_id,
      unit,
      purchase_price,
      sale_price,
      minimum_stock,
      description,
    } = req.body;

    const checkResult = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(sku);
    }
    if (barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      values.push(barcode);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(category_id);
    }
    if (warehouse_id !== undefined) {
      updates.push(`warehouse_id = $${paramIndex++}`);
      values.push(warehouse_id);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(unit);
    }
    if (purchase_price !== undefined) {
      updates.push(`purchase_price = $${paramIndex++}`);
      values.push(purchase_price);
    }
    if (sale_price !== undefined) {
      updates.push(`sale_price = $${paramIndex++}`);
      values.push(sale_price);
    }
    if (minimum_stock !== undefined) {
      updates.push(`minimum_stock = $${paramIndex++}`);
      values.push(minimum_stock);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, req.userId);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

    const result = await query(sql, values);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
});

export default router;
