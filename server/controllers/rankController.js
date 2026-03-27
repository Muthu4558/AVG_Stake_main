import { pool } from "../config/db.js";

// GET
export const getRanks = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rank_config ORDER BY target_amount ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE
export const createRank = async (req, res) => {
  try {
    const { target_amount, reward } = req.body;

    if (!target_amount || !reward) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO rank_config (target_amount, reward)
       VALUES ($1,$2) RETURNING *`,
      [target_amount, reward]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateRank = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_amount, reward } = req.body;

    await pool.query(
      `UPDATE rank_config 
       SET target_amount=$1, reward=$2
       WHERE id=$3`,
      [target_amount, reward, id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteRank = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM rank_config WHERE id=$1",
      [id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE
export const toggleRankStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE rank_config 
       SET status = NOT status
       WHERE id=$1`,
      [id]
    );

    res.json({ message: "Status toggled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};