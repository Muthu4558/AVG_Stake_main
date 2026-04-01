import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

// 🔥 CLEAN TEXT
const clean = (val) => {
  if (!val) return null;
  return val.toString().replace(/\s+/g, "").trim();
};

// 🔥 EXTRACT NUMBER FROM "$300"
const parseNumber = (val) => {
  if (!val) return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

const importUserPlans = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing user plans...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./userPlan.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📊 Rows: ${data.length}`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const userCode = clean(row[1]); // ✅ user_id column contains user_code
      const planId = Number(row[2]);
      const amount = parseNumber(row[3]);
      const dailyROI = parseNumber(row[4]);
      const status = (row[5] || "active").toString().toLowerCase();

      const createdAt = row[6]
        ? moment(row[6], ["D/M/YYYY, h:mm:ss a", moment.ISO_8601], true).toDate()
        : new Date();

      if (!userCode) {
        console.log(`❌ No user_code at row ${i}`);
        skipped++;
        continue;
      }

      // 🔥 CONVERT user_code → user_id
      const userRes = await client.query(
        "SELECT id FROM users WHERE user_code = $1",
        [userCode]
      );

      if (!userRes.rows.length) {
        console.log(`❌ User not found: ${userCode}`);
        skipped++;
        continue;
      }

      const userId = userRes.rows[0].id;

      if (!planId || !amount) {
        console.log(`❌ Invalid plan/amount at row ${i}`);
        skipped++;
        continue;
      }

      // ✅ INSERT DIRECTLY (daily_roi already given)
      await client.query(
        `INSERT INTO user_plans 
        (user_id, plan_id, amount, daily_roi, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, planId, amount, dailyROI, status, createdAt]
      );

      inserted++;
      console.log(`✅ Inserted: ${userCode}`);
    }

    await client.query("COMMIT");

    console.log("🎉 DONE");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠️ Skipped: ${skipped}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed");
    console.error(err);
  } finally {
    client.release();
  }
};

importUserPlans();