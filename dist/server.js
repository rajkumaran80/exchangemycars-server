import * as dotenv from 'dotenv';
dotenv.config();
console.log('CLIENT_ID:', process.env.CLIENT_ID);
import app from './app.js';
import './service/authService.js';
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.use((req, res, next) => {
    console.log("Incoming request:", req.path, req.headers.authorization, req.method);
    next();
});
