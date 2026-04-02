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
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str.length ? str : null;
};

const parseNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const num = String(val).replace(/[^\d.]/g, "");
  return parseFloat(num) || 0;
};

const findUserIdByCode = async (client, userCode) => {
  const res = await client.query(
    `SELECT id FROM users WHERE user_code = $1 LIMIT 1`,
    [userCode]
  );
  return res.rows[0]?.id || null;
};

const findLatestPlanId = async (client, userId, createdAt) => {
  if (!userId) return null;

  if (createdAt) {
    const byDate = await client.query(
      `
      SELECT id
      FROM user_plans
      WHERE user_id = $1
        AND created_at <= $2
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      `,
      [userId, createdAt]
    );

    if (byDate.rows[0]) return byDate.rows[0].id;
  }

  const fallback = await client.query(
    `
    SELECT id
    FROM user_plans
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    `,
    [userId]
  );

  return fallback.rows[0]?.id || null;
};

const importLevelIncome = async () => {
  const client = await pool.connect();

  try {
    console.log("Importing level/direct income...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./levelIncome.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const toCode = clean(row[0]);
      const fromCode = clean(row[1]);
      const level = Number(row[2]) || 0;
      const amount = parseNumber(row[3]);
      const percentage = parseNumber(row[4]);
      const incomeType = (clean(row[5]) || "").toLowerCase();
      const createdAt = row[6] ? new Date(row[6]) : new Date();

      if (!toCode || !fromCode || !incomeType) {
        console.log(`Skipping row ${i}: missing required values`);
        skipped++;
        continue;
      }

      if (!["direct", "level"].includes(incomeType)) {
        console.log(`Skipping row ${i}: invalid income_type`);
        skipped++;
        continue;
      }

      const toUserId = await findUserIdByCode(client, toCode);
      const fromUserId = await findUserIdByCode(client, fromCode);

      if (!toUserId || !fromUserId) {
        console.log(`Skipping row ${i}: user not found`);
        skipped++;
        continue;
      }

      const creditedUserPlanId = await findLatestPlanId(client, toUserId, createdAt);
      const sourceUserPlanId = await findLatestPlanId(client, fromUserId, createdAt);

      if (!creditedUserPlanId || !sourceUserPlanId) {
        console.log(`Skipping row ${i}: missing plan for source or receiver`);
        skipped++;
        continue;
      }

      await client.query(
        `
        INSERT INTO level_income
        (
          user_id,
          from_user_id,
          user_plan_id,
          credited_user_plan_id,
          level,
          amount,
          percentage,
          income_type,
          created_at,
          from_user_code,
          to_user_code
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          toUserId,
          fromUserId,
          sourceUserPlanId,
          creditedUserPlanId,
          level,
          amount,
          percentage,
          incomeType,
          createdAt,
          fromCode,
          toCode,
        ]
      );

      inserted++;
      console.log(`Inserted row ${i}: ${fromCode} -> ${toCode} (${incomeType})`);
    }

    await client.query("COMMIT");

    console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed:", err);
  } finally {
    client.release();
  }
};

importLevelIncome();