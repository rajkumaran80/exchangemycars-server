import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import * as http from "node:http";

const PORT = process.env.PORT;

// Create and start the server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




