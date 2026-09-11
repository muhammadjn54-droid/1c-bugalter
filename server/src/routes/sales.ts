import { Router, Request, Response } from 'express';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales for authenticated user
 *     tags: [Sales]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { customer_id, from_date, to_date } = req.query;
    let sql = `SELECT s.*, c.name as customer_name
               FROM sales s
               LEFT JOIN customers c ON s.customer_id = c.id
               WHERE s.user_id = $1`;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (customer_id) {
      sql += ` AND s.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }

    if (from_date) {
      sql += ` AND s.sale_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      sql += ` AND s.sale_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    sql += ' ORDER BY s.sale_date DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
    });
  }
});

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, sale_date, items]
 *             properties:
 *               customer_id:
 *                 type: string
 *               document_number:
 *                 type: string
 *               sale_date:
 *                 type: string
 *                 format: date
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Sale created
 *       400:
 *         description: Insufficient stock
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      document_number,
      sale_date,
      discount = 0,
      tax = 0,
      notes,
      items,
    } = req.body;

    if (!customer_id || !sale_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer, sale date, and items are required',
      });
    }

    const result = await transaction(async (client) => {
      const saleId = uuidv4();

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }
      totalAmount = totalAmount - discount + tax;

      await client.query(
        `INSERT INTO sales (id, user_id, customer_id, document_number, sale_date, total_amount, discount, tax, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed')`,
        [
          saleId,
          req.userId,
          customer_id,
          document_number,
          sale_date,
          totalAmount,
          discount,
          tax,
          notes,
        ]
      );

      for (const item of items) {
        const productResult = await client.query(
          'SELECT quantity FROM products WHERE id = $1 AND user_id = $2',
          [item.product_id, req.userId]
        );

        if (productResult.rows.length === 0) {
          throw new Error('Product not found');
        }

        const previousQuantity = productResult.rows[0].quantity;

        if (previousQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }

        const itemId = uuidv4();
        const totalPrice = item.quantity * item.unit_price;

        await client.query(
          `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [itemId, saleId, item.product_id, item.quantity, item.unit_price, totalPrice]
        );

        const newQuantity = previousQuantity - item.quantity;

        await client.query('UPDATE products SET quantity = $1 WHERE id = $2', [
          newQuantity,
          item.product_id,
        ]);

        const movementId = uuidv4();
        await client.query(
          `INSERT INTO stock_movements
           (id, user_id, product_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, reference_type, movement_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            movementId,
            req.userId,
            item.product_id,
            'SALE',
            -item.quantity,
            previousQuantity,
            newQuantity,
            saleId,
            'SALE',
          ]
        );
      }

      const saleResult = await client.query('SELECT * FROM sales WHERE id = $1', [saleId]);

      return saleResult.rows[0];
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Create sale error:', error);
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create sale',
    });
  }
});

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get a specific sale
 *     tags: [Sales]
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
 *         description: Sale details with items
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const saleResult = await query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [id, req.userId]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    const itemsResult = await query(
      `SELECT si.*, p.name as product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...saleResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale',
    });
  }
});

export default router;
