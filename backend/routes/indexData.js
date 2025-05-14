const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const { formatDate } = require("../utils/dateUtils");
const logger = require("../logger");

const tables = {
  g03: "G03_INDICIES",
  g05: "G05_INDICIES",
  g5i: "G5I_INDICIES",
  gmi: "GMI_INDICIES",
  tbi: "TBI_INDICIES",
};

// Get data in a date range
router.post("/date-range", async (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate)
    return res
      .status(400)
      .json({ error: "startDate and endDate are required" });

  let formattedStart, formattedEnd;
  try {
    formattedStart = formatDate(startDate);
    formattedEnd = formatDate(endDate);
  } catch (e) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = {};
    const allDatesSet = new Set();
    const tableData = {};

    for (const [key, tableName] of Object.entries(tables)) {
      const query = `
        SELECT INDICE_DATE AS date, INDICE_VALUE AS value 
        FROM ${tableName} 
        WHERE INDICE_DATE BETWEEN ? AND ?
        ORDER BY INDICE_DATE ASC
      `;
      const rows = await conn.query(query, [formattedStart, formattedEnd]);
      const formattedRows = rows.map(({ date, value }) => {
        const iso = new Date(date).toLocaleDateString("en-CA");
        allDatesSet.add(iso);

        return { date: iso, value };
      });
      tableData[key] = formattedRows;
    }

    const labelsX = Array.from(allDatesSet).sort();

    for (const key of Object.keys(tables)) {
      const map = new Map(
        tableData[key].map(({ date, value }) => [date, value])
      );

      result[key] = labelsX.map((date) => ({
        date,
        value: map.get(date) ?? null,
      }));
    }

    res.json({ labelsX, data: result });
  } catch (err) {
    logger.error("date-range error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

// Get data for current year
router.post("/current-year", async (req, res) => {
  const currentYear = new Date().getFullYear();
  let conn;
  try {
    conn = await pool.getConnection();
    const result = {};
    const allDatesSet = new Set();
    const tableData = {};

    for (const [key, tableName] of Object.entries(tables)) {
      const query = `
        SELECT INDICE_DATE AS date, INDICE_VALUE AS value
        FROM ${tableName}
        WHERE YEAR(INDICE_DATE) = ?
        ORDER BY INDICE_DATE ASC
      `;
      const rows = await conn.query(query, [currentYear]);
      const formattedRows = rows.map(({ date, value }) => {
        const iso = new Date(date).toLocaleDateString("en-CA");
        allDatesSet.add(iso);

        return { date: iso, value };
      });
      tableData[key] = formattedRows;
    }

    const labelsX = Array.from(allDatesSet).sort();

    for (const key of Object.keys(tables)) {
      const map = new Map(
        tableData[key].map(({ date, value }) => [date, value])
      );
      result[key] = labelsX.map((date) => ({
        date,
        value: map.get(date) ?? null,
      }));
    }

    res.json({ labelsX, data: result });
  } catch (err) {
    logger.error("current-year error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

// Get all data
router.post("/all", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = {};
    const allDatesSet = new Set();
    const tableData = {};

    for (const [key, tableName] of Object.entries(tables)) {
      const query = `
        SELECT INDICE_DATE AS date, INDICE_VALUE AS value
        FROM ${tableName}
        ORDER BY INDICE_DATE ASC
      `;
      const rows = await conn.query(query);
      const formattedRows = rows.map(({ date, value }) => {
        const iso = new Date(date).toLocaleDateString("en-CA");
        allDatesSet.add(iso);

        return { date: iso, value };
      });
      tableData[key] = formattedRows;
    }

    const labelsX = Array.from(allDatesSet).sort();

    for (const key of Object.keys(tables)) {
      const map = new Map(
        tableData[key].map(({ date, value }) => [date, value])
      );
      result[key] = labelsX.map((date) => ({
        date,
        value: map.get(date) ?? null,
      }));
    }

    res.json({ labelsX, data: result });
  } catch (err) {
    logger.error("all error:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
