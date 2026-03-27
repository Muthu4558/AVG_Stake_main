import { pool } from "../config/db.js";

/* GET WALLET SUMMARY */
export const getWithdrawSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ ROI
    const roiRes = await pool.query(
      `SELECT COALESCE(SUM(total_earned),0) as total 
       FROM roi_transactions rt
       JOIN user_plans up ON up.id = rt.user_plan_id
       WHERE up.user_id = $1`,
      [userId]
    );

    const roi = Number(roiRes.rows[0].total);

    // ✅ DIRECT (5% + 2%)
    const directRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM level_income
       WHERE user_id = $1
       AND income_type IN ('direct','plan_direct')`,
      [userId]
    );

    // ✅ LEVEL (level 2+)
    const levelRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM level_income
       WHERE user_id = $1
       AND income_type = 'level'`,
      [userId]
    );

    res.json({
      roi: Number(roi.toFixed(2)),
      directReferral: Number(directRes.rows[0].total).toFixed(2),
      level: Number(levelRes.rows[0].total).toFixed(2),
      reward: 0,
      usdtPrice: 90
    });

  } catch (err) {
    console.error("summary error:", err);
    res.status(500).json({ error: err.message });
  }
};


/* CREATE WITHDRAW */
export const createWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletType, currencyType, amount } = req.body;

    if (!walletType || !currencyType || !amount) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (amount < 20) {
      return res.status(400).json({ message: "Minimum $20 required" });
    }

    await pool.query(
      `INSERT INTO withdrawals 
      (user_id, wallet_type, currency_type, amount)
      VALUES ($1,$2,$3,$4)`,
      [userId, walletType, currencyType, amount]
    );

    res.json({ message: "Withdraw request created" });

  } catch (err) {
    console.error("createWithdraw error:", err);
    res.status(500).json({ error: err.message });
  }
};


/* GET MY WITHDRAWALS */
export const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT * FROM withdrawals
      WHERE user_id=$1
      ORDER BY id DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error("get withdrawals error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL WITHDRAW REQUESTS (ADMIN)
export const getAllWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        u.name || ' ' || COALESCE(u.lastname,'') AS user,
        u.user_code,
        w.wallet_type,
        w.amount,
        w.transaction_proof,
        w.status,
        w.created_at
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllWithdrawals error:", err);
    res.status(500).json({ error: err.message });
  }
};


// APPROVE / REJECT
export const updateWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      `UPDATE withdrawals SET status=$1 WHERE id=$2`,
      [status, id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    console.error("updateWithdrawStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};


// DELETE
export const deleteWithdraw = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM withdrawals WHERE id=$1`, [id]);

    res.json({ message: "Deleted" });

  } catch (err) {
    console.error("deleteWithdraw error:", err);
    res.status(500).json({ error: err.message });
  }
};