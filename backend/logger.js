require("dotenv").config();
const winston = require("winston");
const path = require("path");

const logFilePath = path.join(
  __dirname,
  "logs",
  process.env.LOG_FILE_PATH || "app.log"
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFilePath }),
  ],
});

module.exports = logger;
