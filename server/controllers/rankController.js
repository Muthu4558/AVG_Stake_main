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

export const getRanksUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 👉 get all ranks
    const rankRes = await pool.query(`
      SELECT id, target_amount, reward
      FROM rank_config
      WHERE status = true
      ORDER BY target_amount ASC
    `);

    const ranks = rankRes.rows;
    if (ranks.length === 0) return res.json([]);

    // 👉 direct referrals
    const directRes = await pool.query(`
      SELECT id, name, lastname
      FROM users
      WHERE referred_by::int = $1
    `, [userId]);

    const getBranchBusiness = async (rootId) => {
      const result = await pool.query(`
        WITH RECURSIVE branch AS (
          SELECT id FROM users WHERE id = $1
          UNION ALL
          SELECT u.id
          FROM users u
          JOIN branch b ON u.referred_by::int = b.id
        )
        SELECT COALESCE(SUM(amount),0) AS total
        FROM user_plans
        WHERE user_id IN (SELECT id FROM branch)
      `, [rootId]);

      return Number(result.rows[0].total || 0);
    };

    // 👉 calculate branches ONCE
    const branches = [];

    for (const user of directRes.rows) {
      const business = await getBranchBusiness(user.id);

      branches.push({
        name: `${user.name} ${user.lastname}`,
        business
      });
    }

    branches.sort((a, b) => b.business - a.business);

    const results = [];

    for (const rank of ranks) {

      const milestones = [
        { percent: 40, amount: rank.target_amount * 0.4 },
        { percent: 30, amount: rank.target_amount * 0.3 },
        { percent: 30, amount: rank.target_amount * 0.3 },
      ];

      let branchIndex = 0;

      const timeline = milestones.map((m) => {
        const branch = branches[branchIndex];

        if (branch && branch.business >= m.amount) {
          branchIndex++;
          return {
            percent: m.percent,
            amount: m.amount,
            achieved: true,
            by: branch.name
          };
        }

        return {
          percent: m.percent,
          amount: m.amount,
          achieved: false,
          by: null
        };
      });

      const progress = timeline
        .filter(t => t.achieved)
        .reduce((sum, t) => sum + t.amount, 0);

      const unlocked = progress >= rank.target_amount;

      // 👉 status from DB
      const rewardRow = await pool.query(
        `SELECT status 
         FROM user_rewards 
         WHERE user_id=$1 AND reward=$2 AND target_amount=$3
         LIMIT 1`,
        [userId, rank.reward, rank.target_amount]
      );

      const status = rewardRow.rows[0]?.status || "pending";

      // 👉 push ALL completed + current
      results.push({
        reward: rank.reward,
        target_amount: rank.target_amount,
        progress,
        unlocked,
        status,
        timeline
      });

      // 🔥 STOP at current active rank
      if (status !== "approved") break;
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsersRewards = async (req, res) => {
  try {
    const rankRes = await pool.query(`
      SELECT id, target_amount, reward
      FROM rank_config
      WHERE status = true
      ORDER BY target_amount ASC
    `);

    const ranks = rankRes.rows;
    if (ranks.length === 0) return res.json([]);

    const usersRes = await pool.query(`
      SELECT id, name, lastname, phone
      FROM users
      ORDER BY id DESC
    `);

    const getBranchBusiness = async (rootId) => {
      const result = await pool.query(`
        WITH RECURSIVE branch AS (
          SELECT id FROM users WHERE id = $1
          UNION ALL
          SELECT u.id
          FROM users u
          JOIN branch b ON u.referred_by::int = b.id
        )
        SELECT COALESCE(SUM(amount),0) AS total
        FROM user_plans
        WHERE user_id IN (SELECT id FROM branch)
      `, [rootId]);

      return Number(result.rows[0].total || 0);
    };

    const finalData = [];

    for (const user of usersRes.rows) {

      const directRes = await pool.query(`
        SELECT id, name, lastname
        FROM users
        WHERE referred_by::int = $1
      `, [user.id]);

      const branches = [];

      for (const d of directRes.rows) {
        const business = await getBranchBusiness(d.id);

        branches.push({
          name: `${d.name} ${d.lastname}`,
          business
        });
      }

      branches.sort((a, b) => b.business - a.business);

      // =========================
      // 🔥 LOOP ALL RANKS
      // =========================

      for (const rank of ranks) {

        const milestones = [
          { percent: 40, amount: rank.target_amount * 0.4 },
          { percent: 30, amount: rank.target_amount * 0.3 },
          { percent: 30, amount: rank.target_amount * 0.3 },
        ];

        let branchIndex = 0;

        const timeline = milestones.map((m) => {
          const branch = branches[branchIndex];

          if (branch && branch.business >= m.amount) {
            branchIndex++;
            return {
              percent: m.percent,
              amount: m.amount,
              achieved: true,
              by: branch.name
            };
          }

          return {
            percent: m.percent,
            amount: m.amount,
            achieved: false,
            by: null
          };
        });

        const progress = timeline
          .filter(t => t.achieved)
          .reduce((sum, t) => sum + t.amount, 0);

        const unlocked = progress >= rank.target_amount;

        // 👉 status
        const rewardRow = await pool.query(
          `SELECT status 
           FROM user_rewards 
           WHERE user_id=$1 AND reward=$2 AND target_amount=$3
           LIMIT 1`,
          [user.id, rank.reward, rank.target_amount]
        );

        const status = rewardRow.rows[0]?.status || "pending";

        // ✅ PUSH EVERY RANK UNTIL CURRENT
        finalData.push({
          userId: user.id,
          username: `${user.name} ${user.lastname}`,
          phone: user.phone,
          reward: rank.reward,
          target_amount: rank.target_amount,
          progress,
          unlocked,
          status,
          timeline
        });

        // 🔥 STOP after current active rank
        if (status !== "approved") break;
      }
    }

    res.json(finalData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateRewardStatus = async (req, res) => {
  try {
    const { userId, reward, target_amount, status, progress } = req.body;

    if (!userId || !reward || !target_amount || !status) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await pool.query(
      `SELECT id FROM user_rewards 
       WHERE user_id=$1 AND reward=$2 AND target_amount=$3`,
      [userId, reward, target_amount]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE user_rewards 
         SET status=$1, progress=$2
         WHERE user_id=$3 AND reward=$4 AND target_amount=$5`,
        [status, progress || 0, userId, reward, target_amount]
      );
    } else {
      await pool.query(
        `INSERT INTO user_rewards 
        (user_id, reward, target_amount, status, progress)
        VALUES ($1,$2,$3,$4,$5)`,
        [userId, reward, target_amount, status, progress || 0]
      );
    }

    res.json({ message: "Status updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};