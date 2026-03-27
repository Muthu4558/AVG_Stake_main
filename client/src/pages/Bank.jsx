import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const Bank = () => {

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [menuOpen, setMenuOpen] = useState(null);
  const dropdownRef = useRef();

  const [loading, setLoading] = useState(true);

  // ✅ FETCH DATA
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/users/banks",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const formatted = res.data.map((b) => ({
          id: b.id,
          username: b.username,
          bank: b.bank_name,
          account: b.account_number,
          // upi: b.upi_id || "-",
          ifsc: b.ifsc_code,
          gpay: b.gpay_number,
          status: b.status || "Pending",
          created: new Date(b.created_at).toLocaleString()
        }));

        setBanks(formatted);

      } catch (err) {
        console.error(err);
        alert("Failed to fetch banks");
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  // ✅ CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* SEARCH */
  const filtered = useMemo(() => {
    return banks.filter((b) =>
      b.username.toLowerCase().includes(search.toLowerCase()) ||
      b.bank.toLowerCase().includes(search.toLowerCase()) ||
      b.account.includes(search)
    );
  }, [search, banks]);

  /* PAGINATION */
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  /* STATUS UPDATE */
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/users/banks/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBanks(prev =>
        prev.map(b => b.id === id ? { ...b, status } : b)
      );

      setMenuOpen(null);

    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  /* DELETE */
  const deleteBank = async (id) => {
    if (!window.confirm("Delete this bank?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/users/banks/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBanks(prev => prev.filter(b => b.id !== id));
      setMenuOpen(null);

    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  /* STATUS STYLE */
  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "badge-approved";
      case "Rejected":
        return "badge-rejected";
      default:
        return "badge-pending";
    }
  };

  if (loading) return <div>Loading banks...</div>;

  return (
    <div className="users-page">

      <div className="users-header">
        <div>
          <h2>User Management</h2>
          <p>Bank Management</p>
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3>Bank Configuration</h3>

        <table className="users-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USERNAME</th>
              <th>BANK</th>
              <th>ACCOUNT</th>
              <th>IFSC Code</th>
              <th>Gpay</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((b, index) => (
              <tr key={b.id}>
                <td>{(page - 1) * rowsPerPage + index + 1}</td>
                <td>{b.username}</td>
                <td>{b.bank}</td>
                <td>{b.account}</td>
                <td>{b.ifsc}</td>
                <td>{b.gpay || "-"}</td>

                <td>
                  <span className={getStatusClass(b.status)}>
                    {b.status}
                  </span>
                </td>

                <td>{b.created}</td>

                <td style={{ position: "relative" }}>
                  <FaEllipsisV
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setMenuOpen(menuOpen === b.id ? null : b.id)
                    }
                  />

                  {menuOpen === b.id && (
                    <div
                      ref={dropdownRef}
                      className="action-dropdown"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 25,
                        background: "#",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 10
                      }}
                    >
                      <div onClick={() => updateStatus(b.id, "Approved")}>
                        ✅ Approve
                      </div>

                      <div onClick={() => updateStatus(b.id, "Rejected")}>
                        ❌ Reject
                      </div>

                      <div
                        className="delete"
                        onClick={() => deleteBank(b.id)}
                        style={{ color: "red" }}
                      >
                        🗑 Delete
                      </div>
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>


      </div>
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
    </div>
  );
};

export default Bank;