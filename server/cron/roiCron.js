import cron from "node-cron";
import { pool } from "../config/db.js";

cron.schedule("* * * * *", async () => {
  console.log("Running ROI cron...");

  try {
    const plans = await pool.query(`
      SELECT id, user_id, amount, daily_roi
      FROM user_plans
      WHERE status = 'active'
    `);

    for (const plan of plans.rows) {
      const maxReturn = Number(plan.amount) * 2;

      // ✅ Get current earned (IMPORTANT: use SUM(amount), not total_earned)
      const totalRes = await pool.query(`
  SELECT 
    COALESCE(r.total,0) AS roi,
    COALESCE(d.total,0) AS direct,
    COALESCE(l.total,0) AS level
  FROM user_plans up

  LEFT JOIN (
    SELECT user_plan_id, SUM(amount) AS total
    FROM roi_transactions
    GROUP BY user_plan_id
  ) r ON r.user_plan_id = up.id

  LEFT JOIN (
    SELECT credited_user_plan_id, SUM(amount) AS total
    FROM level_income
    WHERE income_type IN ('direct','plan_direct')
    GROUP BY credited_user_plan_id
  ) d ON d.credited_user_plan_id = up.id

  LEFT JOIN (
    SELECT credited_user_plan_id, SUM(amount) AS total
    FROM level_income
    WHERE income_type = 'level'
    GROUP BY credited_user_plan_id
  ) l ON l.credited_user_plan_id = up.id

  WHERE up.id = $1
`, [plan.id]);

const row = totalRes.rows[0];

const currentTotal =
  Number(row.roi) +
  Number(row.direct) +
  Number(row.level);

      // ✅ HARD STOP (no more ROI)
      if (currentTotal >= maxReturn) {
        await pool.query(
          `UPDATE user_plans SET status='completed' WHERE id=$1`,
          [plan.id]
        );
        continue;
      }

      let todayROI = Number(plan.daily_roi);

      // ✅ FINAL ADJUSTMENT (no overshoot at all)
      if (currentTotal + todayROI >= maxReturn) {
        todayROI = maxReturn - currentTotal;

        // If nothing left, stop
        if (todayROI <= 0) {
          await pool.query(
            `UPDATE user_plans SET status='completed' WHERE id=$1`,
            [plan.id]
          );
          continue;
        }

        // Insert FINAL ROI (exact limit)
        await pool.query(
          `
          INSERT INTO roi_transactions
          (user_id, user_plan_id, amount, total_earned)
          VALUES ($1, $2, $3, $4)
          `,
          [
            plan.user_id,
            plan.id,
            todayROI,
            maxReturn, // exact cap
          ]
        );

        // Mark completed immediately
        await pool.query(
          `UPDATE user_plans SET status='completed' WHERE id=$1`,
          [plan.id]
        );

        continue;
      }

      // ✅ NORMAL DAILY INSERT
      await pool.query(
        `
        INSERT INTO roi_transactions
        (user_id, user_plan_id, amount, total_earned)
        VALUES ($1, $2, $3, $4)
        `,
        [
          plan.user_id,
          plan.id,
          todayROI,
          currentTotal + todayROI,
        ]
      );
    }

    console.log("ROI cron completed");
  } catch (err) {
    console.error("ROI CRON ERROR:", err);
  }
});