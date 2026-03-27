import cron from "node-cron";
import { pool } from "../config/db.js";

cron.schedule("0 0 * * *", async () => {
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
      const totalRes = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM roi_transactions
        WHERE user_plan_id = $1
        `,
        [plan.id]
      );

      const currentTotal = Number(totalRes.rows[0].total);

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