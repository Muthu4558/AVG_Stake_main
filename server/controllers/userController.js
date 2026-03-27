// controllers/userController.js
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

/* GET ALL USERS (admin) */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_code, name, email, phone, created_at, role, status 
       FROM users 
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* UPDATE STATUS (admin) */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);

    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE USER (admin) */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const result = await pool.query(
      "UPDATE users SET name=$1, email=$2, phone=$3 WHERE id=$4 RETURNING id, name, email, phone",
      [name, email, phone || "", id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated", user: result.rows[0] });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* DELETE USER (admin) */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* GET MY PROFILE */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await pool.query(
      `SELECT id, name, lastname, email, phone, user_code, referral_code, wallet_address
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE MY PROFILE */
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, lastname, email, phone, wallet_address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email required" });
    }

    // ✅ CHECK EMAIL ALREADY EXISTS (IMPORTANT)
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const result = await pool.query(
      `UPDATE users 
   SET name=$1, lastname=$2, email=$3, phone=$4, wallet_address=$5
   WHERE id=$6 
   RETURNING *`,
      [name, lastname, email, phone || "", wallet_address || "", userId]
    );

    res.json({
      message: "Profile updated",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err); // 🔥 SEE REAL ERROR
    res.status(500).json({ error: err.message });
  }
};

/* CHANGE PASSWORD */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const result = await pool.query("SELECT password FROM users WHERE id=$1", [userId]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, row.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashedPassword, userId]);

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllReferrals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u1.id,
        u1.name AS referred_name,
        u1.lastname AS referred_lastname,
        u1.phone AS referred_phone,
        u1.created_at,

        u2.name AS referrer_name,
        u2.lastname AS referrer_lastname,
        u2.phone AS referrer_phone

      FROM users u1

      LEFT JOIN users u2 
        ON u1.referred_by::int = u2.id   -- ✅ ONLY STRING MATCH

      WHERE u1.referred_by IS NOT NULL
      ORDER BY u1.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllReferrals error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const addBankDetails = async (req, res) => {
  try {
    console.log("USER:", req.user); // debug

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branch
    } = req.body;

    console.log("BODY:", req.body); // debug

    if (!accountHolderName || !accountNumber) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    await pool.query(
      `INSERT INTO bank_details 
      (user_id, account_holder_name, bank_name, account_number, ifsc_code, branch)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        userId,
        accountHolderName,
        bankName || "",
        accountNumber,
        ifscCode || "",
        branch || ""
      ]
    );

    res.json({ message: "Bank details added" });

  } catch (err) {
    console.error("ADD BANK ERROR:", err); // 🔥 THIS WILL SHOW REAL ISSUE
    res.status(500).json({ error: err.message });
  }
};

export const getAllBankDetails = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        u.name AS username,
        b.bank_name,
        b.account_number,
        b.ifsc_code,
        b.upi_id,
        b.gpay_number,
        b.status,
        b.created_at
      FROM bank_details b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllBankDetails error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateBankStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE bank_details SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM bank_details WHERE id=$1", [id]);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// user bank
export const getMyBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM bank_details WHERE user_id=$1 LIMIT 1",
      [userId]
    );

    res.json(result.rows[0] || null);

  } catch (err) {
    console.error("getMyBankDetails error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const saveMyBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branch,
      upiId,
      gpayNumber,
    } = req.body;

    if (!accountHolderName || !accountNumber) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existing = await pool.query(
      "SELECT id FROM bank_details WHERE user_id=$1",
      [userId]
    );

    if (existing.rows.length > 0) {
      // ✅ UPDATE
      await pool.query(
        `UPDATE bank_details 
         SET account_holder_name=$1, bank_name=$2, account_number=$3, ifsc_code=$4, branch=$5, upi_id=$6, gpay_number=$7
         WHERE user_id=$8`,
        [accountHolderName, bankName, accountNumber, ifscCode, branch, upiId, gpayNumber, userId]
      );
    } else {
      // ✅ INSERT
      await pool.query(
        `INSERT INTO bank_details 
         (user_id, account_holder_name, bank_name, account_number, ifsc_code, branch, upi_id, gpay_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [userId, accountHolderName, bankName, accountNumber, ifscCode, branch, upiId, gpayNumber]
      );
    }

    res.json({ message: "Saved successfully" });

  } catch (err) {
    console.error("saveMyBankDetails error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE TICKET
export const createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shortDesc, description } = req.body;

    if (!shortDesc || !description) {
      return res.status(400).json({ message: "All fields required" });
    }

    const ticketId = "TKT" + Math.floor(100000 + Math.random() * 900000);

    const result = await pool.query(
      `INSERT INTO support_tickets 
      (user_id, ticket_id, short_desc, description)
      VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [userId, ticketId, shortDesc, description]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("createTicket error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY TICKETS
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM support_tickets 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("getMyTickets error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.ticket_id,
        t.short_desc,
        t.status,
        t.created_at,
        u.name AS username
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllTickets error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE TICKET STATUS (ADMIN)
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status required" });
    }

    await pool.query(
      "UPDATE support_tickets SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ message: "Ticket status updated" });

  } catch (err) {
    console.error("updateTicketStatus error:", err);
    res.status(500).json({ error: err.message });
  }
};

// user reffral
export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        name AS username,
        lastname,
        phone,
        created_at
      FROM users
      WHERE referred_by = $1   -- ✅ FIXED
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("getMyReferrals error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET MY NETWORK TREE =================
export const getMyNetwork = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ FUNCTION TO CALCULATE WALLET
    const getWallet = async (uid) => {
      const result = await pool.query(
        `
        SELECT 
          COALESCE(roi.total,0) AS roi,
          COALESCE(direct.total,0) AS direct,
          COALESCE(level.total,0) AS level

        FROM users u

        LEFT JOIN (
          SELECT user_id, SUM(total_earned) AS total
          FROM roi_transactions
          GROUP BY user_id
        ) roi ON roi.user_id = u.id

        LEFT JOIN (
          SELECT user_id, SUM(amount) AS total
          FROM level_income
          WHERE income_type IN ('direct','plan_direct')
          GROUP BY user_id
        ) direct ON direct.user_id = u.id

        LEFT JOIN (
          SELECT user_id, SUM(amount) AS total
          FROM level_income
          WHERE income_type = 'level'
          GROUP BY user_id
        ) level ON level.user_id = u.id

        WHERE u.id = $1
        `,
        [uid]
      );

      const row = result.rows[0];

      return Number(row.roi) + Number(row.direct) + Number(row.level);
    };

    // ✅ ROOT USER
    const rootRes = await pool.query(
      `SELECT id, name, lastname FROM users WHERE id=$1`,
      [userId]
    );

    const rootUser = rootRes.rows[0];

    // ✅ RECURSIVE TREE
    const buildTree = async (parentId) => {
      const result = await pool.query(
        `SELECT id, name, lastname 
         FROM users 
         WHERE referred_by=$1`,
        [parentId]
      );

      return Promise.all(
        result.rows.map(async (child) => ({
          name: child.name,
          lastname: child.lastname,
          id: child.id,
          wallet: await getWallet(child.id), // 🔥 REAL WALLET
          children: await buildTree(child.id),
        }))
      );
    };

    const tree = {
      name: rootUser.name,
      lastname: rootUser.lastname,
      id: rootUser.id,
      wallet: await getWallet(userId), // 🔥 MATCHES TOPBAR
      children: await buildTree(userId),
    };

    res.json(tree);

  } catch (err) {
    console.error("getMyNetwork error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL USERS (for dropdown)
export const getUsersForDropdown = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, user_code FROM users ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL PLANS (for dropdown)
export const getPlansForDropdown = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name FROM plans ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyDirectIncome = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        li.id,
        u_from.name AS from_name,
        u_from.lastname AS from_lastname,
        u_from.user_code AS from_code,

        u_to.name AS to_name,
        u_to.lastname AS to_lastname,
        u_to.user_code AS to_code,

        li.income_type,
        li.amount,
        li.created_at

      FROM level_income li

      JOIN users u_from ON u_from.id = li.from_user_id
      JOIN users u_to ON u_to.id = li.user_id

      WHERE li.user_id = $1
      AND li.income_type IN ('direct','plan_direct')

      ORDER BY li.created_at DESC
      `,
      [userId]
    );

    const data = result.rows.map((item) => ({
      id: item.id,
      from: `${item.from_name} ${item.from_lastname}`,
      fromId: item.from_code,
      to: `${item.to_name} ${item.to_lastname}`,
      toId: item.to_code,
      type: item.income_type,
      amount: Number(item.amount).toFixed(2),
      date: item.created_at,
    }));

    res.json(data);

  } catch (err) {
    console.error("getMyDirectIncome error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyLevelIncome = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        li.id,
        li.level,

        u_from.name AS from_name,
        u_from.lastname AS from_lastname,
        u_from.user_code AS from_code,

        u_to.name AS to_name,
        u_to.lastname AS to_lastname,
        u_to.user_code AS to_code,

        li.amount,
        li.created_at

      FROM level_income li

      JOIN users u_from ON u_from.id = li.from_user_id
      JOIN users u_to ON u_to.id = li.user_id

      WHERE li.user_id = $1
      AND li.income_type = 'level'

      ORDER BY li.created_at DESC
      `,
      [userId]
    );

    const data = result.rows.map((item) => ({
      id: item.id,
      from: `${item.from_name} ${item.from_lastname}`,
      fromId: item.from_code,
      to: `${item.to_name} ${item.to_lastname}`,
      toId: item.to_code,
      type: `Level ${item.level}`,
      amount: Number(item.amount).toFixed(2),
      date: item.created_at,
    }));

    res.json(data);

  } catch (err) {
    console.error("getMyLevelIncome error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyDepositStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_count,
        COALESCE(SUM(amount),0) AS total_amount,
        
        COUNT(*) FILTER (
          WHERE DATE(created_at) = CURRENT_DATE
        ) AS today_count,

        COALESCE(SUM(amount) FILTER (
          WHERE DATE(created_at) = CURRENT_DATE
        ),0) AS today_amount

      FROM user_plans
      WHERE user_id = $1
      `,
      [userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("deposit stats error:", err);
    res.status(500).json({ error: err.message });
  }
};

// admin direct income
export const getAllDirectIncome = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        li.id,
        li.amount AS income,
        li.income_type AS type,
        li.created_at,

        u_from.name || ' ' || u_from.lastname AS from_user,
        u_to.name || ' ' || u_to.lastname AS to_user

      FROM level_income li

      JOIN users u_from 
        ON u_from.id = li.from_user_id

      JOIN users u_to 
        ON u_to.id = li.user_id

      WHERE li.income_type IN ('direct','plan_direct')

      ORDER BY li.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllDirectIncome error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllLevelIncome = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        li.id,
        li.level,
        li.amount AS income,
        li.created_at,

        -- FROM USER (who generated income)
        u_from.name AS from_name,
        u_from.lastname AS from_lastname,
        u_from.user_code AS from_code,

        -- TO USER (who received income)
        u_to.name,
        u_to.lastname,
        u_to.user_code

      FROM level_income li

      JOIN users u_from 
        ON u_from.id = li.from_user_id

      JOIN users u_to 
        ON u_to.id = li.user_id

      WHERE li.income_type = 'level'  -- ✅ ONLY LEVEL

      ORDER BY li.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("getAllLevelIncome error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    /* ================= USERS ================= */
    const usersRes = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = true) AS active,
        COUNT(*) FILTER (WHERE status = false) AS inactive
      FROM users
    `);

    /* ================= DEPOSITS ================= */
    const depositRes = await pool.query(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(amount),0) AS total_amount,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_count,
        COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE),0) AS today_amount
      FROM user_plans
    `);

    /* ================= WITHDRAW ================= */
    const withdrawRes = await pool.query(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(amount),0) AS total_amount,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM withdrawals
    `);

    /* ================= ROI INCOME ================= */
    const roiRes = await pool.query(`
      SELECT COALESCE(SUM(total_earned),0) AS total
      FROM roi_transactions
    `);

    /* ================= DIRECT INCOME ================= */
    const directRes = await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS total
      FROM level_income
      WHERE income_type IN ('direct','plan_direct')
    `);

    /* ================= LEVEL INCOME ================= */
    const levelRes = await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS total
      FROM level_income
      WHERE income_type = 'level'
    `);

    /* ================= TICKETS ================= */
    const ticketRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status='open') AS open,
        COUNT(*) FILTER (WHERE status='in_progress') AS progress,
        COUNT(*) FILTER (WHERE status='closed') AS closed
      FROM support_tickets
    `);

    res.json({
      users: {
        total: Number(usersRes.rows[0].total),
        active: Number(usersRes.rows[0].active),
        inactive: Number(usersRes.rows[0].inactive),
      },

      deposits: {
        total_count: Number(depositRes.rows[0].total_count),
        total_amount: Number(depositRes.rows[0].total_amount).toFixed(2),
        today_count: Number(depositRes.rows[0].today_count),
        today_amount: Number(depositRes.rows[0].today_amount).toFixed(2),
      },

      withdrawals: {
        total_count: Number(withdrawRes.rows[0].total_count),
        total_amount: Number(withdrawRes.rows[0].total_amount).toFixed(2),
        pending: Number(withdrawRes.rows[0].pending),
      },

      income: {
        roi: Number(roiRes.rows[0].total).toFixed(2),
        direct: Number(directRes.rows[0].total).toFixed(2),
        level: Number(levelRes.rows[0].total).toFixed(2),
      },

      tickets: {
        open: Number(ticketRes.rows[0].open),
        progress: Number(ticketRes.rows[0].progress),
        closed: Number(ticketRes.rows[0].closed),
      }
    });

  } catch (err) {
    console.error("getAdminDashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAdminWallet = async (req, res) => {
  try {
    // ✅ ROI
    const roiRes = await pool.query(`
      SELECT COALESCE(SUM(total_earned),0) AS total 
      FROM roi_transactions
    `);

    const roi = Number(roiRes.rows[0].total);

    // ✅ DIRECT + LEVEL
    const incomeRes = await pool.query(`
      WITH RECURSIVE referral_tree AS (
        SELECT id, user_code, 1 AS level
        FROM users
        WHERE referred_by IS NOT NULL

        UNION ALL

        SELECT u.id, u.user_code, rt.level + 1
        FROM users u
        JOIN referral_tree rt ON u.referred_by = rt.user_code
      )

      SELECT 
        rt.level,
        p.amount,
        lc.percentage,
        (p.amount * lc.percentage / 100) AS income
      FROM referral_tree rt
      LEFT JOIN user_plans p ON p.user_id = rt.id
      LEFT JOIN level_config lc ON lc.level = rt.level AND lc.status = true
    `);

    let direct = 0;
    let level = 0;

    incomeRes.rows.forEach((row) => {
      const inc = Number(row.income || 0);
      if (row.level === 1) direct += inc;
      else level += inc;
    });

    const total = roi + direct + level;

    res.json({
      roi,
      direct,
      level,
      total,
    });

  } catch (err) {
    console.error("admin wallet error:", err);
    res.status(500).json({ error: err.message });
  }
};