import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const totalSalesResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE user_id = $1 AND status = $2',
      [req.userId, 'confirmed']
    );

    const totalPurchasesResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE user_id = $1 AND status = $2',
      [req.userId, 'confirmed']
    );

    const totalExpensesResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1',
      [req.userId]
    );

    const totalIncomeResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = $1',
      [req.userId]
    );

    const lowStockResult = await query(
      'SELECT COUNT(*) as count FROM products WHERE user_id = $1 AND quantity <= minimum_stock',
      [req.userId]
    );

    const recentSalesResult = await query(
      `SELECT s.*, c.name as customer_name FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.user_id = $1 ORDER BY s.sale_date DESC LIMIT 5`,
      [req.userId]
    );

    const totalSales = parseFloat(totalSalesResult.rows[0].total) || 0;
    const totalPurchases = parseFloat(totalPurchasesResult.rows[0].total) || 0;
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total) || 0;
    const totalIncome = parseFloat(totalIncomeResult.rows[0].total) || 0;

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses + totalIncome;

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalIncome,
        grossProfit,
        netProfit,
        lowStockProducts: parseInt(lowStockResult.rows[0].count),
        recentSales: recentSalesResult.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
});

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Get inventory report
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory report
 */
router.get('/inventory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name, w.name as warehouse_name,
              (p.quantity * p.purchase_price) as inventory_value
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN warehouses w ON p.warehouse_id = w.id
       WHERE p.user_id = $1
       ORDER BY p.name`,
      [req.userId]
    );

    const totalInventoryValue = result.rows.reduce(
      (sum, p) => sum + (parseFloat(p.inventory_value) || 0),
      0
    );

    res.json({
      success: true,
      data: {
        products: result.rows,
        totalInventoryValue,
        totalProducts: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory report',
    });
  }
});

/**
 * @swagger
 * /reports/profit:
 *   get:
 *     summary: Get profit report
 *     tags: [Reports]
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
 *         description: Profit report
 */
router.get('/profit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;

    let salesSql = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE user_id = $1';
    let purchasesSql = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE user_id = $1';
    let expensesSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1';
    let incomeSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = $1';

    const params: any[] = [req.userId];

    if (from_date) {
      salesSql += ` AND sale_date >= $2`;
      purchasesSql += ` AND purchase_date >= $2`;
      expensesSql += ` AND expense_date >= $2`;
      incomeSql += ` AND income_date >= $2`;
      params.push(from_date);
    }

    if (to_date) {
      const dateParam = from_date ? 3 : 2;
      salesSql += ` AND sale_date <= $${dateParam}`;
      purchasesSql += ` AND purchase_date <= $${dateParam}`;
      expensesSql += ` AND expense_date <= $${dateParam}`;
      incomeSql += ` AND income_date <= $${dateParam}`;
      params.push(to_date);
    }

    const [salesResult, purchasesResult, expensesResult, incomeResult] = await Promise.all([
      query(salesSql, params),
      query(purchasesSql, params),
      query(expensesSql, params),
      query(incomeSql, params),
    ]);

    const revenue = parseFloat(salesResult.rows[0].total) || 0;
    const costOfGoods = parseFloat(purchasesResult.rows[0].total) || 0;
    const expenses = parseFloat(expensesResult.rows[0].total) || 0;
    const income = parseFloat(incomeResult.rows[0].total) || 0;

    const grossProfit = revenue - costOfGoods;
    const netProfit = grossProfit - expenses + income;

    res.json({
      success: true,
      data: {
        revenue,
        costOfGoods,
        grossProfit,
        expenses,
        income,
        netProfit,
      },
    });
  } catch (error) {
    console.error('Profit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit report',
    });
  }
});

/**
 * @swagger
 * /reports/stock-movements:
 *   get:
 *     summary: Get stock movement history
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock movements
 */
router.get('/stock-movements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { product_id } = req.query;

    let sql = `SELECT sm.*, p.name as product_name, p.sku
               FROM stock_movements sm
               JOIN products p ON sm.product_id = p.id
               WHERE sm.user_id = $1`;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (product_id) {
      sql += ` AND sm.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    sql += ' ORDER BY sm.movement_date DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Stock movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movements',
    });
  }
});

export default router;
