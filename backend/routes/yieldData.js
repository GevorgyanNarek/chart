const express = require("express");
const router = express.Router();

const pool = require("../utils/db");
const curveMap = require("../utils/curveMap");
const logger = require("../logger");

// Helper: Parse CName to sort maturities
function parseName(name) {
  const match = name.match(/(\d+)\s([dmy])/);

  if (!match) return [Infinity, ""];
  const num = parseInt(match[1]);
  const unit = match[2];
  const factor = unit === "d" ? 1 : unit === "m" ? 30 : 365;

  return [num * factor, unit];
}

// Helper: Get curve name
function getCurveName(curve) {
  return curveMap[curve] || null;
}

router.post("/by-date", async (req, res) => {
  const { date, curve } = req.body;
  const curveName = getCurveName(curve);
  if (!date || !curveName)
    return res.status(400).json({ error: "Invalid input" });

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT ${curveName}, CName
      FROM v_sec_interestrate
      JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID
      WHERE PRICEDATE = ?`;
    const rows = await conn.query(query, [date]);

    const filtered = rows
      .filter((r) => r[curveName] !== null)
      .sort((a, b) => parseName(a.CName)[0] - parseName(b.CName)[0]);

    res.json({
      date,
      values: filtered.map((r) => r[curveName]),
      margins: filtered.map((r) => r.CName),
    });
  } catch (err) {
    logger.error("DB error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

router.post("/by-dates", async (req, res) => {
  let { dates, curve } = req.body;
  const curveName = getCurveName(curve);
  if (!Array.isArray(dates) || !curveName)
    return res.status(400).json({ error: "Invalid input" });

  let conn;
  try {
    conn = await pool.getConnection();
    if (!dates.length) {
      const [latest] = await conn.query(
        "SELECT MAX(PRICEDATE) AS latestDate FROM v_sec_interestrate"
      );
      if (!latest?.latestDate)
        return res.status(404).json({ error: "No data found" });
      dates = [latest.latestDate];
    }

    const results = await Promise.all(
      dates.map((date) =>
        conn.query(
          `SELECT ${curveName}, CName
           FROM v_sec_interestrate
           JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID
           WHERE PRICEDATE = ?`,
          [date]
        )
      )
    );

    const response = results.map((rows, i) => {
      const filtered = rows
        .filter((r) => r[curveName] !== null)
        .sort((a, b) => parseName(a.CName)[0] - parseName(b.CName)[0]);
      return {
        date: dates[i],
        values: filtered.map((r) => r[curveName]),
        margins: filtered.map((r) => r.CName),
      };
    });

    res.json(response);
  } catch (err) {
    logger.error("DB error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

router.post("/all", async (req, res) => {
  const { curve } = req.body;
  const curveName = getCurveName(curve);
  if (!curveName) return res.status(400).json({ error: "Invalid curve type" });

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT ${curveName} AS value, 
             TO_CHAR(PRICEDATE, 'yyyy/mm/dd') AS date,
             CName AS maturity
      FROM v_sec_interestrate
      JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID`;

    const rows = await conn.query(query);

    const grouped = new Map();

    for (const { date, maturity, value } of rows) {
      if (value === null) continue;
      if (!grouped.has(date)) grouped.set(date, { date });
      grouped.get(date)[maturity] = value;
    }

    const result = Array.from(grouped.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((entry) =>
        Object.fromEntries(
          Object.entries(entry).sort((a, b) => {
            if (a[0] === "date") return -1;
            if (b[0] === "date") return 1;
            return parseName(a[0])[0] - parseName(b[0])[0];
          })
        )
      );

    res.json(result);
  } catch (err) {
    logger.error("DB error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

router.post("/current-year", async (req, res) => {
  const { curve } = req.body;
  const curveName = getCurveName(curve);
  if (!curveName) return res.status(400).json({ error: "Invalid curve type" });

  const currentYear = new Date().getFullYear();
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT ${curveName} AS value,
             TO_CHAR(PRICEDATE, 'yyyy/mm/dd') AS date,
             CName AS maturity
      FROM v_sec_interestrate
      JOIN v_sec_period ON v_sec_interestrate.SEC_PERIOD = v_sec_period.REFID
      WHERE YEAR(PRICEDATE) = ?`;

    const rows = await conn.query(query, [currentYear]);

    const grouped = rows.reduce((acc, { date, maturity, value }) => {
      if (value === null) return acc;
      if (!acc[date]) acc[date] = { date };
      acc[date][maturity] = value;
      return acc;
    }, {});

    const result = Object.values(grouped)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((entry) =>
        Object.fromEntries(
          Object.entries(entry).sort(
            (a, b) => parseName(a[0])[0] - parseName(b[0])[0]
          )
        )
      );

    res.json(result);
  } catch (err) {
    logger.error("DB error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
