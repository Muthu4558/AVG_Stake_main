import { pool } from "../config/db.js";

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

const getUplineUserId = async (client, userId) => {
  const result = await client.query(
    `SELECT referred_by FROM users WHERE id = $1`,
    [userId]
  );

  const ref = result.rows[0]?.referred_by;
  if (!ref) return null;

  const numericRef = Number(ref);
  if (Number.isFinite(numericRef) && String(ref).trim() !== "") {
    return numericRef;
  }

  const parent = await client.query(
    `SELECT id FROM users WHERE user_code = $1 LIMIT 1`,
    [String(ref).trim()]
  );

  return parent.rows[0]?.id ?? null;
};

const getReceiverPlanId = async (client, receiverUserId) => {
  let result = await client.query(
    `
    SELECT id
    FROM user_plans
    WHERE user_id = $1 AND status = 'active'
    ORDER BY id DESC
    LIMIT 1
    `,
    [receiverUserId]
  );

  if (!result.rows.length) {
    result = await client.query(
      `
      SELECT id
      FROM user_plans
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [receiverUserId]
    );
  }

  return result.rows[0]?.id ?? null;
};

export const creditLevelIncome = async ({
  buyerId,
  planAmount,
  userPlanId,
}) => {
  const client = await pool.connect();

  try {
    const amount = Number(planAmount);

    if (!buyerId || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid data");
    }

    await client.query("BEGIN");

    const levelConfigs = await getActiveLevelConfigs(client);

    if (!levelConfigs.length) {
      await client.query("COMMIT");
      return;
    }

    // Build upline chain: direct parent -> grand parent -> next
    const uplineChain = [];
    let current = buyerId;

    while (true) {
      const parentId = await getUplineUserId(client, current);
      if (!parentId) break;

      if (uplineChain.includes(parentId)) break; // safety for loops
      uplineChain.push(parentId);
      current = parentId;
    }

    for (let i = 0; i < uplineChain.length; i++) {
      const receiverId = uplineChain[i];
      const level = i + 1;

      const config = levelConfigs.find(
        (l) => Number(l.level) === level
      );

      if (!config) continue;

      // Only pay users who have a plan
      const receiverPlanId = await getReceiverPlanId(client, receiverId);
      if (!receiverPlanId) continue;

      const percentage = Number(config.percentage);
      const incomeAmount = Number(((amount * percentage) / 100).toFixed(2));

      if (incomeAmount <= 0) continue;

      await client.query(
        `INSERT INTO level_income
          (user_id, from_user_id, user_plan_id, credited_user_plan_id, level, amount, percentage, income_type, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'level',NOW())`,
        [
          receiverId,      // who earns
          buyerId,         // who generated the income
          userPlanId,      // buyer's plan
          receiverPlanId,  // receiver's own plan
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

export const createLevel = async (req, res) => {
  try {
    const { level, percentage } = req.body;

    if (level === undefined || percentage === undefined) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO level_config (level, percentage)
       VALUES ($1, $2)
       RETURNING *`,
      [Number(level), Number(percentage)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("createLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, percentage } = req.body;

    const result = await pool.query(
      `UPDATE level_config
       SET level = $1, percentage = $2
       WHERE id = $3
       RETURNING *`,
      [Number(level), Number(percentage), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM level_config WHERE id = $1", [id]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteLevel error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLevelStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE level_config SET status = NOT status WHERE id = $1`,
      [id]
    );

    res.json({ message: "Toggled" });
  } catch (err) {
    console.error("toggleLevelStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};