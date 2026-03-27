import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

const LevelEarnings = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [viewItem, setViewItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/users/admin/level-income",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const formatted = (res.data || []).map((item) => ({
          id: item.id,
          fromUser: `${item.from_name} ${item.from_lastname} ${item.from_code}`,
          toUser: `${item.name} ${item.lastname} ${item.user_code}`,
          type: `Level ${item.level} Income`,
          amount: `$${Number(item.income || 0).toFixed(2)}`,
          createdAt: new Date(item.created_at).toLocaleString(),
        }));

        setData(formatted);

      } catch (err) {
        console.error("Fetch level income error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter(r =>
      r.fromUser.toLowerCase().includes(q) ||
      r.toUser.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.amount.toLowerCase().includes(q) ||
      r.createdAt.toLowerCase().includes(q)
    );
  }, [search, data]);

  // ✅ PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Earnings</h2>
          <p>Level Income</p>
        </div>

        <input
          className="tx-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: 15 }}>Level Income</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>FROM USER</th>
              <th>TO USER</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>CREATED AT</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="no-data">Loading...</td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No records found</td>
              </tr>
            ) : (
              pageItems.map((row, i) => (
                <tr key={row.id}>
                  <td>{startIndex + i + 1}</td>
                  <td>{row.fromUser}</td>
                  <td>{row.toUser}</td>
                  <td>
                    <span className="type-badge type-level">{row.type}</span>
                  </td>
                  <td>{row.amount}</td>
                  <td>{row.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
      {/* PAGINATION */}
        <div className="pagination">
          <div className="usrDeposit__rows">
            Rows per page
            <select value={rowsPerPage} onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>

          <div>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={page === i + 1 ? "active" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
    </div>
  );
};

export default LevelEarnings;