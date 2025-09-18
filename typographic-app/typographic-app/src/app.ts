import express from 'express';
import { json } from 'body-parser';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';

const app = express();

// Middleware
app.use(json());
app.use(routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;