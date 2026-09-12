import { Router, Request, Response } from 'express';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Get all purchases for authenticated user
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
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
 *         description: List of purchases
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { supplier_id, status, from_date, to_date } = req.query;
    let sql = `SELECT p.*, s.name as supplier_name
               FROM purchases p
               LEFT JOIN suppliers s ON p.supplier_id = s.id
               WHERE p.user_id = $1`;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (supplier_id) {
      sql += ` AND p.supplier_id = $${paramIndex}`;
      params.push(supplier_id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (from_date) {
      sql += ` AND p.purchase_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      sql += ` AND p.purchase_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    sql += ' ORDER BY p.purchase_date DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases',
    });
  }
});

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Create a new purchase
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplier_id, purchase_date, items]
 *             properties:
 *               supplier_id:
 *                 type: string
 *               document_number:
 *                 type: string
 *               purchase_date:
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
 *         description: Purchase created
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      supplier_id,
      document_number,
      purchase_date,
      discount = 0,
      tax = 0,
      notes,
      items,
    } = req.body;

    if (!supplier_id || !purchase_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier, purchase date, and items are required',
      });
    }

    const result = await transaction(async (client) => {
      const purchaseId = uuidv4();

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }
      totalAmount = totalAmount - discount + tax;

      await client.query(
        `INSERT INTO purchases (id, user_id, supplier_id, document_number, purchase_date, total_amount, discount, tax, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed')`,
        [
          purchaseId,
          req.userId,
          supplier_id,
          document_number,
          purchase_date,
          totalAmount,
          discount,
          tax,
          notes,
        ]
      );

      for (const item of items) {
        const itemId = uuidv4();
        const totalPrice = item.quantity * item.unit_price;

        await client.query(
          `INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [itemId, purchaseId, item.product_id, item.quantity, item.unit_price, totalPrice]
        );

        const productResult = await client.query(
          'SELECT quantity FROM products WHERE id = $1 AND user_id = $2',
          [item.product_id, req.userId]
        );

        if (productResult.rows.length === 0) {
          throw new Error('Product not found');
        }

        const previousQuantity = productResult.rows[0].quantity;
        const newQuantity = previousQuantity + item.quantity;

        await client.query(
          'UPDATE products SET quantity = $1 WHERE id = $2',
          [newQuantity, item.product_id]
        );

        const movementId = uuidv4();
        await client.query(
          `INSERT INTO stock_movements
           (id, user_id, product_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, reference_type, movement_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            movementId,
            req.userId,
            item.product_id,
            'PURCHASE',
            item.quantity,
            previousQuantity,
            newQuantity,
            purchaseId,
            'PURCHASE',
          ]
        );
      }

      const purchaseResult = await client.query(
        'SELECT * FROM purchases WHERE id = $1',
        [purchaseId]
      );

      return purchaseResult.rows[0];
    });

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase',
    });
  }
});

/**
 * @swagger
 * /purchases/{id}:
 *   get:
 *     summary: Get a specific purchase
 *     tags: [Purchases]
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
 *         description: Purchase details with items
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseResult = await query(
      `SELECT p.*, s.name as supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.userId]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    const itemsResult = await query(
      `SELECT pi.*, p.name as product_name, p.sku
       FROM purchase_items pi
       JOIN products p ON pi.product_id = p.id
       WHERE pi.purchase_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...purchaseResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase',
    });
  }
});

/**
 * @swagger
 * /purchases/{id}:
 *   delete:
 *     summary: Delete a purchase
 *     tags: [Purchases]
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
 *         description: Purchase deleted
 *       404:
 *         description: Purchase not found
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseResult = await query(
      'SELECT * FROM purchases WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    await query('DELETE FROM purchase_items WHERE purchase_id = $1', [id]);
    await query('DELETE FROM purchases WHERE id = $1 AND user_id = $2', [id, req.userId]);

    res.json({
      success: true,
      message: 'Purchase deleted successfully',
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase',
    });
  }
});

export default router;
