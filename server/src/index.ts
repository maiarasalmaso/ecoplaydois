import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start Server for local development
app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running locally on http://0.0.0.0:${PORT}`);
});
