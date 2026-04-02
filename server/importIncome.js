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

const importIncome = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Import started...");
    await client.query("BEGIN");

    const workbook = xlsx.readFile("./income.xlsx"); // 👈 your file
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
      const incomeType = clean(row[5])?.toLowerCase();
      const createdAt = row[6] ? new Date(row[6]) : new Date();

      // ✅ VALIDATION
      if (!toCode || !fromCode || !incomeType) {
        console.log(`❌ Missing data at row ${i}`);
        skipped++;
        continue;
      }

      if (!["direct", "level"].includes(incomeType)) {
        console.log(`❌ Invalid income_type at row ${i}`);
        skipped++;
        continue;
      }

      // 🔥 GET IDs
      const toUser = await client.query(
        "SELECT id FROM users WHERE user_code = $1",
        [toCode]
      );

      const fromUser = await client.query(
        "SELECT id FROM users WHERE user_code = $1",
        [fromCode]
      );

      if (!toUser.rows.length || !fromUser.rows.length) {
        console.log(`❌ User not found at row ${i}`);
        skipped++;
        continue;
      }

      const toUserId = toUser.rows[0].id;
      const fromUserId = fromUser.rows[0].id;

      // 🔥 INSERT
      await client.query(
        `
        INSERT INTO level_income
        (
          user_id,
          from_user_id,
          from_user_code,
          to_user_code,
          level,
          amount,
          percentage,
          income_type,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
          toUserId,
          fromUserId,
          fromCode,
          toCode,
          level,
          amount,
          percentage,
          incomeType,
          createdAt,
        ]
      );

      inserted++;
      console.log(`✅ ${fromCode} → ${toCode}`);
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

importIncome();