require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mariadb = require("mariadb"); // MariaDB client
const bodyParser = require("body-parser");
const app = express();
const logger = require("./logger");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 3000;

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = process.env.LOG_FORMAT || "combined";
const logStream = fs.createWriteStream(
  path.join(__dirname, process.env.LOG_FILE_PATH || "logs/access.log"),
  { flags: "a" }
);

// Use cors middleware to enable CORS
app.use(bodyParser.json());
app.use(cors());
app.use(morgan(logFormat, { stream: logStream }));

// Create a MariaDB connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 15, // Connection pool limit
});

// Centralized error handling function
function handleDatabaseError(res, err) {
  logger.error(`Database error: ${err.message}`);
  res.status(500).send("Internal Server Error");
}

// POST /singledata
app.post("/singledata", async (req, res) => {
  const { date, curve } = req.body;

  if (!date || !curve) {
    res.status(400).json({ error: "Invalid request format" });
    return;
  }

  const curveMap = {
    SPOT: "SPOT",
    TBILL: "TBILLRATE",
    YIELD: "BEFORE_MAT",
  };

  const curveName = curveMap[curve] || null;
  if (!curveName) return res.status(400).json({ error: "Invalid curve type" });

  let conn;
  try {
    conn = await pool.getConnection();
    const query = ` 
      SELECT ${curveName},CName 
      FROM v_sec_interestrate 
      JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD=v_sec_period.REFID
      WHERE CALCDATE = ? 
    `;
    const rows = await conn.query(query, [date]);

    const filteredRows = rows
      .filter((row) => row[curveName] !== null)
      .sort((a, b) => parseName(a.CName)[0] - parseName(b.CName)[0]);

    const response = {
      values: filteredRows.map((row) => row[curveName]),
      margins: filteredRows.map((row) => row.CName),
      date,
    };

    res.json(response || {});
  } catch (err) {
    handleDatabaseError(res, err);
  } finally {
    if (conn) conn.release();
  }
});

// POST /somedata
app.post("/somedata", async (req, res) => {
  let { dates, curve } = req.body;

  if (!Array.isArray(dates) || !curve) {
    return res.status(400).json({ error: "Invalid request format" });
  }

  const curveMap = {
    SPOT: "SPOT",
    TBILL: "TBILLRATE",
    YIELD: "BEFORE_MAT",
  };

  const curveName = curveMap[curve] || null;
  if (!curveName) return res.status(400).json({ error: "Invalid curve type" });

  let conn;
  try {
    conn = await pool.getConnection();

    // If dates is null or empty, fetch the latest CALCDATE
    if (!Array.isArray(dates) || dates.length === 0) {
      const [latestDateRow] = await conn.query(
        "SELECT MAX(CALCDATE) AS latestDate FROM v_sec_interestrate"
      );
      if (!latestDateRow || !latestDateRow.latestDate) {
        return res.status(404).json({ error: "No data available" });
      }
      dates = [latestDateRow.latestDate]; // Use the latest date as the only value in dates array
    }
    console.log(dates);
    logger.info(`last date is ${dates}`);
    
    const results = await Promise.all(
      dates.map((date) =>
        conn.query(
          `SELECT ${curveName},CName 
           FROM v_sec_interestrate 
           JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD=v_sec_period.REFID
           WHERE CALCDATE = ?`,
          [date]
        )
      )
    );
    const response = results.map((data,index) => {
      const filteredRows = data
        .filter((row) => row[curveName] !== null)
        .sort((a, b) => parseName(a.CName)[0] - parseName(b.CName)[0]);

      return {
        values: filteredRows.map((row) => row[curveName]),
        margins: filteredRows.map((row) => row.CName),
        date: dates[index]
      };
    });
    res.json(response || {});
  } catch (err) {
    handleDatabaseError(res, err);
  } finally {
    if (conn) conn.release();
  }
});

// GET /alldata
app.get("/alldata", async (req, res) => {
  const { curve } = req.query;

  const curveMap = {
    SPOT: "SPOT",
    TBILL: "TBILLRATE",
    YIELD: "BEFORE_MAT",
  };
  const curveName = curveMap[curve] || null;
  if (!curveName) return res.status(400).json({ error: "Invalid curve type" });

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT ${curveName} as value,  to_char(CALCDATE, 'yyyy/mm/dd') as date, CName as maturity
      FROM v_sec_interestrate 
      JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID
    `;
    const rows = await conn.query(query);
    conn.release();

    console.log(rows);

    // Group rows by date, constructing an object for each date
    const grouped = rows.reduce((acc, { date, maturity, value }) => {
      if (value === null) return acc;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][maturity] = value;
      return acc;
    }, {});

    // Function to dynamically sort keys in each object
    // const reorderObjectKeysDynamically = (obj) => {
    //   // Get all keys except 'date'
    //   const maturityKeys = Object.keys(obj).filter((key) => key !== "date");
    //   // Sort using parseName helper. Note that parseName returns [numericValue, unit]
    //   maturityKeys.sort((a, b) => {
    //     const [aValue] = parseName(a);
    //     const [bValue] = parseName(b);
    //     return aValue - bValue;
    //   });
    //   // Build new object: date comes first, then sorted maturity keys
    //   const orderedObj = { date: obj.date };
    //   maturityKeys.forEach((key) => {
    //     orderedObj[key] = obj[key];
    //   });
    //   return orderedObj;
    // };

    // Reorder keys for each grouped object
    const result = Object.values(grouped).map((item) =>
      Object.fromEntries(
        Object.entries(item).sort((a, b) => parseName(a[0])[0] - parseName(b[0])[0])
      )
    );

    res.json(result);
  } catch (err) {
    handleDatabaseError(res, err);
  }
});

// GET /currentdata
app.post("/currentdata", async (req, res) => {
  const currentYear = new Date().getFullYear() - 1;

  const { curve } = req.body;
  let curveName = "";
  switch (curve) {
    case "SPOT":
      curveName = "SPOT";
      break;
    case "TBILL":
      curveName = "TBILLRATE";
      break;
    case "YIELD":
      curveName = "BEFORE_MAT";
      break;
    default:
      break;
  }
  try {
    const conn = await pool.getConnection();
    const query = `SELECT ${curveName} as value,  to_char(CALCDATE, 'yyyy/mm/dd') as date, CName as maturity
                   FROM v_sec_interestrate 
                   JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID
                   WHERE YEAR(CALCDATE) = ?`; // Extracting the year from CALCDATE
    const rows = await conn.query(query, [currentYear]);
    conn.release();

    // Group rows by date, constructing an object for each date
    const grouped = rows.reduce((acc, { date, maturity, value }) => {
      if (value === null) return acc;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][maturity] = value;
      return acc;
    }, {});

    // Function to dynamically sort keys in each object
    const reorderObjectKeysDynamically = (obj) => {
      // Get all keys except 'date'
      const maturityKeys = Object.keys(obj).filter((key) => key !== "date");
      // Sort using parseName helper. Note that parseName returns [numericValue, unit]
      maturityKeys.sort((a, b) => {
        const [aValue] = parseName(a);
        const [bValue] = parseName(b);
        return aValue - bValue;
      });
      // Build new object: date comes first, then sorted maturity keys
      const orderedObj = { date: obj.date };
      maturityKeys.forEach((key) => {
        orderedObj[key] = obj[key];
      });
      return orderedObj;
    };

    // Reorder keys for each grouped object
    const result = Object.values(grouped).map((item) =>
      reorderObjectKeysDynamically(item)
    );

    res.json(result);
  } catch (err) {
    handleDatabaseError(res, err);
  }
});

const parseName = (name) => {
  const match = name.match(/^(\d+)\s*(day|month|year)$/);
  if (!match) return [Infinity, name]; // Handle unexpected cases
  const value = parseInt(match[1], 10);
  const unit = match[2];

  // Convert to a comparable value (days < months < years)
  if (unit === "day") return [value, unit];
  if (unit === "month") return [value + 100, unit]; // Offset months higher than days
  if (unit === "year") return [value + 1000, unit]; // Offset years higher than months
};

// Start the server
app.listen(port, () => {
  logger.info(`Application started at ${port} port`);
  console.log(`Server listening at http://localhost:${port}`);
});
