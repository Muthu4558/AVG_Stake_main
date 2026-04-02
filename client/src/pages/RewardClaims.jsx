import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const RewardClaims = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [form, setForm] = useState({});

  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ranks/claims/admin");
      setRows(res.data || []);
    } catch (err) {
      alert("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const keyOf = (row) =>
    `${row.user_id}-${row.reward}-${row.target_amount}`;

  const handleChange = (key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (row) => {
    const key = keyOf(row);
    const current = form[key] || {};

    try {
      setSavingKey(key);

      await api.post("/ranks/claims", {
        userId: row.user_id,
        reward: row.reward,
        target_amount: row.target_amount,
        monthly_amount:
          current.monthly_amount ?? row.monthly_amount,
        months_count:
          current.months_count ?? row.months_count ?? 12,
        start_date:
          current.start_date ??
          row.start_date ??
          new Date().toISOString().slice(0, 10),
      });

      fetchData();
      alert("Saved");
    } catch (err) {
      alert("Error saving");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="rc-container">
      <h2 className="rc-title">Reward Claims</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="rc-table-wrapper">
          <table className="rc-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Reward</th>
                <th>Target</th>
                <th>Monthly</th>
                <th>Start</th>
                <th>Months</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const key = keyOf(row);
                const local = form[key] || {};

                return (
                  <tr key={key}>
                    <td>
                      {row.name} {row.lastname}
                    </td>
                    <td>{row.reward}</td>
                    <td>₹{row.target_amount}</td>

                    <td>
                      <input
                        type="number"
                        value={
                          local.monthly_amount ??
                          row.monthly_amount ??
                          ""
                        }
                        onChange={(e) =>
                          handleChange(
                            key,
                            "monthly_amount",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={
                          local.start_date ??
                          row.start_date ??
                          ""
                        }
                        onChange={(e) =>
                          handleChange(
                            key,
                            "start_date",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={
                          local.months_count ??
                          row.months_count ??
                          12
                        }
                        onChange={(e) =>
                          handleChange(
                            key,
                            "months_count",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <button
                        onClick={() => handleSave(row)}
                        disabled={savingKey === key}
                      >
                        {savingKey === key
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RewardClaims;