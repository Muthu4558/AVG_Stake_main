import { pool } from "../config/db.js";

// ✅ GET ALL
export const getLevels = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM level_config ORDER BY level ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getLevels error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE
export const createLevel = async (req, res) => {
  try {
    const { level, percentage } = req.body;

    if (!level || !percentage) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO level_config (level, percentage)
       VALUES ($1,$2) RETURNING *`,
      [level, percentage]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("createLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE
export const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, percentage } = req.body;

    await pool.query(
      `UPDATE level_config 
       SET level=$1, percentage=$2
       WHERE id=$3`,
      [level, percentage, id]
    );

    res.json({ message: "Updated" });

  } catch (err) {
    console.error("updateLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE
export const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM level_config WHERE id=$1",
      [id]
    );

    res.json({ message: "Deleted" });

  } catch (err) {
    console.error("deleteLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ TOGGLE STATUS
export const toggleLevelStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE level_config 
      SET status = NOT status
      WHERE id = $1
    `, [id]);

    res.json({ message: "Status toggled" });

  } catch (err) {
    console.error("toggle error:", err);
    res.status(500).json({ error: err.message });
  }
};