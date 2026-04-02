import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import {
  createUser,
  findUserByEmail,
  findUserByReferral
} from "../models/userModel.js";
import { createReferralChain } from "../models/referralModel.js";
import { generateUserCode } from "../utils/generateUserCode.js";

export const signup = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, lastname, email, phone, password, referralCode } = req.body;

    if (!name || !lastname || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await client.query("BEGIN");

    const existingEmail = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Email already exists" });
    }

    let sponsor = null;

    if (referralCode) {
      const refUser = await client.query(
        "SELECT id, user_code FROM users WHERE user_code = $1",
        [referralCode.trim()]
      );

      if (!refUser.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid referral code" });
      }

      sponsor = refUser.rows[0];
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_code = generateUserCode();

    const user = await createUser(
      {
        user_code,
        password: hashedPassword,
        role: "user",
        name,
        lastname,
        email,
        phone,
        referred_by: sponsor ? sponsor.user_code : null,
      },
      client
    );

    if (sponsor) {
      await createReferralChain(client, user.user_code, sponsor.user_code);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "User created successfully",
      user_code: user.user_code,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const adminSignup = async (req, res) => {
  try {
    const { name, lastname, email, phone, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user_code = "ADMIN" + Math.floor(1000 + Math.random() * 9000);

    const admin = await createUser({
      user_code,
      password: hashedPassword,
      role: "admin",
      name,
      lastname,
      email,
      phone,
      referred_by: null,
    });

    res.status(201).json({
      message: "Admin created",
      user_code: admin.user_code
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { user_code, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE user_code = $1",
      [user_code]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.status) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact admin."
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user_code: user.user_code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginAsUser = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, role, user_code, status
       FROM users
       WHERE id = $1`,
      [id]
    );

    const targetUser = result.rows[0];

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.status === false) {
      return res.status(403).json({ message: "User account is deactivated" });
    }

    const token = jwt.sign(
      { id: targetUser.id, role: targetUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: targetUser.role,
      user_code: targetUser.user_code,
      redirectTo: targetUser.role === "admin" ? "/admin/dashboard" : "/user-dashboard",
    });
  } catch (error) {
    console.error("loginAsUser error:", error);
    res.status(500).json({ error: error.message });
  }
};