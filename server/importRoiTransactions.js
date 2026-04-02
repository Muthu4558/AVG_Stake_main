import { Pool } from "pg";
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

const clean = (val) => {
  if (!val) return null;
  return val.toString().trim();
};

const parseNumber = (val) => {
  if (!val) return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

const importROI = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Importing ROI transactions...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./roi.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const userCode = clean(row[0]);
      const planId = Number(row[1]);
      const amount = parseNumber(row[2]);
      const type = clean(row[3]) || "roi";
      const totalEarned = parseNumber(row[4]);
      const createdAt = row[5] ? new Date(row[5]) : new Date();

      if (!userCode || !planId) {
        console.log(`❌ Missing data at row ${i}`);
        skipped++;
        continue;
      }

      // 🔥 GET USER ID
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

      // 🔥 GET USER PLAN ID (IMPORTANT)
      const planRes = await client.query(
        `SELECT id FROM user_plans 
         WHERE user_id = $1 AND plan_id = $2
         ORDER BY id DESC LIMIT 1`,
        [userId, planId]
      );

      if (!planRes.rows.length) {
        console.log(`❌ No user_plan found for ${userCode}`);
        skipped++;
        continue;
      }

      const userPlanId = planRes.rows[0].id;

      // 🔥 INSERT
      await client.query(
        `
        INSERT INTO roi_transactions
        (
          user_id,
          plan_id,
          amount,
          type,
          created_at,
          total_earned,
          user_plan_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          userId,
          planId,
          amount,
          type,
          createdAt,
          totalEarned,
          userPlanId,
        ]
      );

      inserted++;
      console.log(`✅ ROI added: ${userCode}`);
    }

    await client.query("COMMIT");

    console.log("🎉 DONE");
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⚠️ Skipped: ${skipped}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Import failed", err);
  } finally {
    client.release();
  }
};

importROI();