import { pool } from "../config/db.js";

export const createUser = async ({
  user_code,
  password,
  role = "user",
  name,
  lastname,
  email,
  phone,
  referral_code,
  referred_by
}) => {
  const query = `
    INSERT INTO users 
    (user_code, password, role, name, lastname, email, phone, referral_code, referred_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  const values = [
    user_code,
    password,
    role,
    name,
    lastname || "",
    email,
    phone,
    referral_code,
    referred_by || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

export const findUserByReferral = async (referral_code) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE referral_code = $1",
    [referral_code]
  );
  return result.rows[0];
};