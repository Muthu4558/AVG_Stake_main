import { pool } from "../config/db.js";

/**
 * ✅ GET ACTIVE LEVEL CONFIGS
 */
const getActiveLevelConfigs = async (client) => {
  const result = await client.query(`
    SELECT level, percentage
    FROM level_config
    WHERE status = true
    ORDER BY level ASC
  `);

  return result.rows.map((row) => ({
    level: Number(row.level),
    percentage: Number(row.percentage),
  }));
};

/**
 * ✅ GET UPLINE USER ID
 */
const getUplineUserId = async (client, userId) => {
  const result = await client.query(
    `SELECT referred_by FROM users WHERE id = $1`,
    [userId]
  );

  const ref = result.rows[0]?.referred_by;
  if (!ref) return null;

  if (!isNaN(ref)) return Number(ref);

  const parent = await client.query(
    `SELECT id FROM users WHERE user_code = $1`,
    [ref]
  );

  return parent.rows[0]?.id ?? null;
};

/**
 * ✅ FINAL CORRECT LEVEL INCOME FUNCTION
 */
export const creditLevelIncome = async ({
  buyerId,
  planAmount,
  userPlanId,
  creditedUserPlanId,
}) => {
  const client = await pool.connect();

  try {
    const amount = Number(planAmount);

    if (!buyerId || !amount) {
      throw new Error("Invalid data");
    }

    await client.query("BEGIN");

    const levelConfigs = await getActiveLevelConfigs(client);

    if (!levelConfigs.length) {
      await client.query("COMMIT");
      return;
    }

    /**
     * 🔥 STEP 1: BUILD UPLINE CHAIN
     * [direct, level1, level2, ...]
     */
    const uplineChain = [];
    let current = await getUplineUserId(client, buyerId);

    while (current) {
      if (uplineChain.includes(current)) break;
      uplineChain.push(current);
      current = await getUplineUserId(client, current);
    }

    /**
     * 🔥 STEP 2: APPLY CORRECT LEVEL LOGIC
     */
    for (let i = 0; i < uplineChain.length; i++) {
      const receiverId = uplineChain[i];

      // ✅ IMPORTANT FIX
      const level = i + 1;

      const config = levelConfigs.find(
        (l) => Number(l.level) === level
      );

      if (!config) continue;

      const percentage = Number(config.percentage);
      const incomeAmount = Number(
        ((amount * percentage) / 100).toFixed(2)
      );

      if (incomeAmount <= 0) continue;

      await client.query(
        `INSERT INTO level_income
        (user_id, from_user_id, user_plan_id, credited_user_plan_id, level, amount, percentage, income_type, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'level',NOW())`,
        [
          receiverId,
          buyerId,
          userPlanId,
          creditedUserPlanId,
          level,
          incomeAmount,
          percentage,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("LEVEL INCOME ERROR:", err);
    throw err;
  } finally {
    client.release();
  }
};

/* ================= LEVEL CRUD ================= */

// GET
export const getLevels = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM level_config ORDER BY level ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE
export const createLevel = async (req, res) => {
  try {
    const { level, percentage } = req.body;

    const result = await pool.query(
      `INSERT INTO level_config (level, percentage)
       VALUES ($1,$2) RETURNING *`,
      [Number(level), Number(percentage)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, percentage } = req.body;

    const result = await pool.query(
      `UPDATE level_config
       SET level=$1, percentage=$2
       WHERE id=$3 RETURNING *`,
      [Number(level), Number(percentage), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteLevel = async (req, res) => {
  try {
    await pool.query("DELETE FROM level_config WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE
export const toggleLevelStatus = async (req, res) => {
  try {
    await pool.query(
      `UPDATE level_config SET status = NOT status WHERE id=$1`,
      [req.params.id]
    );
    res.json({ message: "Toggled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};