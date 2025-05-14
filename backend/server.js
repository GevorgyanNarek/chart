require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const logger = require("./logger");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logStream = fs.createWriteStream(
  path.join(logDir, process.env.LOG_FILE_PATH || "access.log"),
  { flags: "a" }
);
app.use(morgan(process.env.LOG_FORMAT || "combined", { stream: logStream }));

// Routes
app.use("/api/index-data", require("./routes/indexData"));
app.use("/api/yield-data", require("./routes/yieldData"));
// app.use(...) ← You can modularize all other routes similarly

// Start
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
