import express from 'express';
import { json } from 'body-parser';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
app.use(routes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});