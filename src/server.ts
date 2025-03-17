import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import * as http from "node:http";
import cors from "cors";

const PORT = process.env.PORT;

console.log("CORS Origin:", process.env.CORS_ORIGIN);


app.use(cors({
  origin: process.env.CORS_ORIGIN
}));



// Create and start the server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




