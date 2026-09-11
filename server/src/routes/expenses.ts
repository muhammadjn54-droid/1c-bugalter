import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Get all expenses
 *     tags: [Expenses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of expenses
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = 'SELECT * FROM expenses WHERE user_id = $1';
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (from_date) {
      sql += ` AND expense_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      sql += ` AND expense_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    sql += ' ORDER BY expense_date DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
    });
  }
});

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Expenses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, amount, expense_date]
 *             properties:
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *               expense_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               payment_method:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, amount, expense_date, description, payment_method } = req.body;

    if (!category || amount === undefined || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and date are required',
      });
    }

    const expenseId = uuidv4();

    await query(
      `INSERT INTO expenses (id, user_id, category, amount, expense_date, description, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [expenseId, req.userId, category, amount, expense_date, description, payment_method]
    );

    const result = await query('SELECT * FROM expenses WHERE id = $1', [expenseId]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
    });
  }
});

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
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
 *         description: Expense deleted
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
    });
  }
});

export default router;
