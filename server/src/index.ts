import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import warehousesRoutes from './routes/warehouses';
import customersRoutes from './routes/customers';
import suppliersRoutes from './routes/suppliers';
import purchasesRoutes from './routes/purchases';
import salesRoutes from './routes/sales';
import reportsRoutes from './routes/reports';
import expensesRoutes from './routes/expenses';
import incomeRoutes from './routes/income';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Accounting & Inventory Management System API',
      version: '1.0.0',
      description: 'Professional accounting and inventory management system API',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/warehouses', warehousesRoutes);
app.use('/customers', customersRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/purchases', purchasesRoutes);
app.use('/sales', salesRoutes);
app.use('/reports', reportsRoutes);
app.use('/expenses', expensesRoutes);
app.use('/income', incomeRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});

export default app;
