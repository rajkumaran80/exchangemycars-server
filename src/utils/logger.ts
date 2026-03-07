import winston from 'winston';

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create a logger
const logger = winston.createLogger({
  level: 'info', // Log level (e.g., 'info', 'debug', 'warn', 'error')
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamp
    winston.format.colorize(), // Add colors to console output
    logFormat // Apply the custom log format
  ),
  transports: [
    // Log to console
    new winston.transports.Console(),

    // Log to a file
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

export default logger;