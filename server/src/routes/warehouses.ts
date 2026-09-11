import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM warehouses WHERE user_id = $1 ORDER BY name',
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses',
    });
  }
});

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a warehouse
 *     tags: [Warehouses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const warehouseId = uuidv4();

    await query(
      'INSERT INTO warehouses (id, user_id, name, location) VALUES ($1, $2, $3, $4)',
      [warehouseId, req.userId, name, location]
    );

    const result = await query('SELECT * FROM warehouses WHERE id = $1', [warehouseId]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Warehouse with this name already exists',
      });
    }
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse',
    });
  }
});

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Update a warehouse
 *     tags: [Warehouses]
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
 *         description: Warehouse updated
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const checkResult = await query(
      'SELECT * FROM warehouses WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(location);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, req.userId);

    const sql = `UPDATE warehouses SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse',
    });
  }
});

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Delete a warehouse
 *     tags: [Warehouses]
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
 *         description: Warehouse deleted
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM warehouses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    res.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete warehouse',
    });
  }
});

export default router;
