import * as dotenv from 'dotenv';
dotenv.config();

console.log('CLIENT_ID:', process.env.CLIENT_ID);


import app from './app.js';
import './config/auth.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});