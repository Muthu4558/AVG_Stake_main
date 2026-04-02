import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const Referral = () => {

  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [menuOpen, setMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(true);

  // ✅ FETCH DATA
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/users/referrals",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const formatted = res.data.map((r) => ({
          id: r.id,

          // ✅ FULL NAME FIX
          referrer:
            `${r.referrer_name || ""} ${r.referrer_lastname || ""}`.trim() || "N/A",

          referred:
            `${r.referred_name || ""} ${r.referred_lastname || ""}`.trim() || "N/A",

          referrerCode: r.referrer_code || "-",
          referredCode: r.referred_code || "-",

          referrerPhone: r.referrer_phone || "-",
          referredPhone: r.referred_phone || "-",

          level: "Level 1",

          created: new Date(r.created_at).toLocaleString()
        }));

        setReferrals(formatted);

      } catch (err) {
        console.error(err);
        alert("Failed to fetch referrals");
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  /* SEARCH */

  const filtered = useMemo(() => {
    return referrals.filter((r) =>
      r.referrer.toLowerCase().includes(search.toLowerCase()) ||
      r.referred.toLowerCase().includes(search.toLowerCase()) ||
      r.referredPhone.includes(search)
    );
  }, [search, referrals]);

  /* PAGINATION */

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  /* DELETE (optional API later) */

  const confirmDelete = () => {
    setReferrals(referrals.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  };

  if (loading) return <div>Loading referrals...</div>;

  return (
    <div className="users-page">

      <div className="users-header">
        <div>
          <h2>User Management</h2>
          <p>Referral Management</p>
        </div>

        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: "15px" }}>All Referrals</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>REFERRER</th>
              <th>REFERRED</th>
              <th>REFERRER PHONE</th>
              <th>REFERRED PHONE</th>
              <th>LEVEL</th>
              <th>CREATED</th>
              {/* <th>ACTIONS</th> */}
            </tr>
          </thead>

          <tbody>
            {paginated.map((r, index) => (
              <tr key={r.id}>
                <td>{(page - 1) * rowsPerPage + index + 1}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{r.referrer}</span>
                    <small style={{ color: "#aaa" }}>{r.referrerCode}</small>
                  </div>
                </td>

                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{r.referred}</span>
                    <small style={{ color: "#aaa" }}>{r.referredCode}</small>
                  </div>
                </td>
                <td>{r.referrerPhone}</td>
                <td>{r.referredPhone}</td>
                <td><span className="level-badge">{r.level}</span></td>
                <td>{r.created}</td>

                {/* <td className="action-cell">
                  <FaEllipsisV
                    onClick={() =>
                      setMenuOpen(menuOpen === r.id ? null : r.id)
                    }
                  />

                  {menuOpen === r.id && (
                    <div className="action-dropdown">

                      <div onClick={() => {
                        setViewData(r);
                        setMenuOpen(null);
                      }}>
                        View
                      </div>

                      <div
                        className="delete"
                        onClick={() => {
                          setDeleteId(r.id);
                          setMenuOpen(null);
                        }}
                      >
                        Delete
                      </div>

                    </div>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">

        <div className="usrDeposit__rows">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>

        <div>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={page === i + 1 ? "active" : ""}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>

      </div>

      {/* VIEW MODAL */}
      {viewData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Referral Details</h3>
            <p><b>Referrer:</b> {viewData.referrer}</p>
            <p><b>Referred:</b> {viewData.referred}</p>
            <p><b>Phone:</b> {viewData.referredPhone}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Referral;