import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const AllTransactions = () => {

    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState(10);
    const [menu, setMenu] = useState(null);

    const [viewData, setViewData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const token = localStorage.getItem("token");

    // ✅ FETCH FROM BACKEND
    const fetchTransactions = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/user-plans/transactions-all",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const formatted = (res.data || []).map((d, index) => ({
                id: d.id + "-" + index, // prevent duplicate id clash
                from: `${d.from_user} (${d.from_id})`,
                to: `${d.to_user} (${d.to_id})`,
                type: d.type,
                amount: `$${Number(d.amount).toFixed(2)}`,
                created: new Date(d.created_at).toLocaleString()
            }));

            setData(formatted);

        } catch (err) {
            console.error("Admin TX fetch error:", err);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    /* SEARCH */
    const filtered = useMemo(() => {
        return data.filter(d =>
            d.from.toLowerCase().includes(search.toLowerCase()) ||
            d.to.toLowerCase().includes(search.toLowerCase()) ||
            d.type.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, data]);

    /* PAGINATION */
    const totalPages = Math.ceil(filtered.length / rows) || 1;
    const paginated = filtered.slice((page - 1) * rows, page * rows);

    /* DELETE (LOCAL ONLY UI — backend optional) */
    const confirmDelete = () => {
        setData(data.filter(d => d.id !== deleteId));
        setDeleteId(null);
    };

    /* EDIT */
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const saveEdit = () => {
        setData(data.map(d => d.id === editData.id ? editData : d));
        setEditData(null);
    };

    return (

        <div className="users-page">

            {/* HEADER */}
            <div className="users-header">
                <div>
                    <h2>Transactions</h2>
                    <p>All Transactions Management</p>
                </div>

                <input
                    placeholder="Search by user or type..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {/* TABLE */}
            <div className="table-card">

                <h3 style={{ marginBottom: "15px" }}>Transaction List</h3>

                <table className="users-table">
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>FROM USER</th>
                            <th>TO USER</th>
                            <th>TYPE</th>
                            <th>AMOUNT</th>
                            <th>CREATED AT</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan="7">No transactions found</td>
                            </tr>
                        ) : (
                            paginated.map((d, i) => (
                                <tr key={d.id}>

                                    <td>{(page - 1) * rows + i + 1}</td>

                                    <td>{d.from}</td>

                                    <td>{d.to}</td>

                                    <td>
                                        <span className="type-badge">
                                            {d.type}
                                        </span>
                                    </td>

                                    <td>{d.amount}</td>

                                    <td>{d.created}</td>

                                    <td className="action-cell">

                                        <FaEllipsisV
                                            onClick={() => setMenu(menu === d.id ? null : d.id)}
                                        />

                                        {menu === d.id && (
                                            <div className="action-dropdown">

                                                <div onClick={() => setViewData(d)}>View</div>

                                                <div onClick={() => setEditData(d)}>Edit</div>

                                                <div
                                                    className="delete"
                                                    onClick={() => setDeleteId(d.id)}
                                                >
                                                    Delete
                                                </div>

                                            </div>
                                        )}

                                    </td>

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

                        <select
                            value={rows}
                            onChange={(e) => {
                                setRows(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                        </select>

                        {/* <span style={{ marginLeft: "10px" }}>
                            {filtered.length === 0
                                ? "0-0 of 0"
                                : `${(page - 1) * rows + 1}-${Math.min(page * rows, filtered.length)} of ${filtered.length}`
                            }
                        </span> */}
                    </div>

                    <div>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
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
                        <div className="modal-header">
                            <h3>Transaction Details</h3>
                            <button onClick={() => setViewData(null)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p><b>From:</b> {viewData.from}</p>
                            <p><b>To:</b> {viewData.to}</p>
                            <p><b>Type:</b> {viewData.type}</p>
                            <p><b>Amount:</b> {viewData.amount}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editData && (
                <div className="modal-overlay">
                    <div className="modal-container">

                        <div className="modal-header">
                            <h3>Edit Transaction</h3>
                            <button onClick={() => setEditData(null)}>✕</button>
                        </div>

                        <div className="modal-body">

                            <div className="form-group">

                                <label>From User</label>
                                <input
                                    name="from"
                                    value={editData.from}
                                    onChange={handleEditChange}
                                />

                                <label>To User</label>
                                <input
                                    name="to"
                                    value={editData.to}
                                    onChange={handleEditChange}
                                />

                                <label>Type</label>
                                <input
                                    name="type"
                                    value={editData.type}
                                    onChange={handleEditChange}
                                />

                                <label>Amount</label>
                                <input
                                    name="amount"
                                    value={editData.amount}
                                    onChange={handleEditChange}
                                />

                            </div>

                        </div>

                        <div className="modal-footer">
                            <button onClick={saveEdit}>Save</button>
                            <button onClick={() => setEditData(null)}>Cancel</button>
                        </div>

                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteId && (
                <div className="modal-overlay">
                    <div className="delete-modal">

                        <h3>Delete Transaction</h3>
                        <p>Are you sure you want to delete this transaction?</p>

                        <div className="delete-buttons">
                            <button onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn-danger" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default AllTransactions;