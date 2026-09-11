import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /income:
 *   get:
 *     summary: Get all income
 *     tags: [Income]
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
 *         description: List of income
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = 'SELECT * FROM income WHERE user_id = $1';
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (from_date) {
      sql += ` AND income_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      sql += ` AND income_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    sql += ' ORDER BY income_date DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income',
    });
  }
});

/**
 * @swagger
 * /income:
 *   post:
 *     summary: Create an income entry
 *     tags: [Income]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, amount, income_date]
 *             properties:
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *               income_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Income created
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, amount, income_date, description } = req.body;

    if (!category || amount === undefined || !income_date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and date are required',
      });
    }

    const incomeId = uuidv4();

    await query(
      `INSERT INTO income (id, user_id, category, amount, income_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [incomeId, req.userId, category, amount, income_date, description]
    );

    const result = await query('SELECT * FROM income WHERE id = $1', [incomeId]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create income',
    });
  }
});

/**
 * @swagger
 * /income/{id}:
 *   delete:
 *     summary: Delete an income entry
 *     tags: [Income]
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
 *         description: Income deleted
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM income WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income not found',
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully',
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income',
    });
  }
});

export default router;
