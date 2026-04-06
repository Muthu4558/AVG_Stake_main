import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const WithdrawTransactions = () => {

    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState(10);
    const [menu, setMenu] = useState(null);

    const [viewData, setViewData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const token = localStorage.getItem("token");

    // ✅ FETCH DATA FROM BACKEND
    const fetchData = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/withdrawals/all",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const formatted = (res.data || []).map((d) => {
                const amount = Number(d.amount);

                const fee = amount * 0.10;        // 10%
                const approved = amount * 95;     // your logic

                return {
                    id: d.id,
                    user: `${d.name} ${d.lastname} (${d.user_code})`,
                    wallet: d.wallet_type,
                    amount,
                    amountDisplay: `$${amount.toFixed(2)}`,
                    fee: fee.toFixed(2),
                    approved: approved.toFixed(2),
                     currency: d.currency_type || "USD",

                    status: d.status,
                    created: new Date(d.created_at).toLocaleString()
                };
            });

            setData(formatted);

        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    /* SEARCH */
    const filtered = useMemo(() => {
        return data.filter(d =>
            d.user.toLowerCase().includes(search.toLowerCase()) ||
            d.wallet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, data]);

    /* PAGINATION */
    const totalPages = Math.ceil(filtered.length / rows);
    const paginated = filtered.slice((page - 1) * rows, page * rows);

    /* DELETE (API) */
    const confirmDelete = async () => {
        try {
            await axios.delete(
                `http://localhost:5000/api/withdrawals/${deleteId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setDeleteId(null);
            fetchData();
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    /* EDIT (ONLY FRONTEND UPDATE - OPTIONAL) */
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const saveEdit = () => {
        setData(data.map(d => d.id === editData.id ? editData : d));
        setEditData(null);
    };

    /* APPROVE (API) */
    const approve = async (id) => {
        try {
            await axios.put(
                `http://localhost:5000/api/withdrawals/${id}/status`,
                { status: "APPROVED" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (err) {
            console.error("Approve error:", err);
        }
    };

    /* REJECT (API) */
    const reject = async (id) => {
        try {
            await axios.put(
                `http://localhost:5000/api/withdrawals/${id}/status`,
                { status: "REJECTED" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (err) {
            console.error("Reject error:", err);
        }
    };

    return (

        <div className="users-page">

            {/* HEADER */}
            <div className="users-header">
                <div>
                    <h2>Transactions</h2>
                    <p>Withdraw Management</p>
                </div>

                <input
                    placeholder="Search by user, wallet type, or proof..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* TABLE */}
            <div className="table-card">

                <h3 style={{ marginBottom: "15px" }}>Withdraw List</h3>

                <table className="users-table">
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>USER</th>
                            <th>WALLET TYPE</th>
                            <th>REQUEST AMOUNT</th>
                            <th>TRANSACTION PROOF</th>
                            <th>STATUS</th>
                            <th>CREATED AT</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.map((d, i) => (
                            <tr key={d.id}>
                                <td>{(page - 1) * rows + i + 1}</td>
                                <td>{d.user}</td>
                                <td>{d.wallet}</td>
                                <td>{d.amount}</td>
                                <td>{d.proof}</td>

                                <td>
                                    <span className={`status-badge ${d.status.toLowerCase()}`}>
                                        {d.status}
                                    </span>
                                </td>

                                <td>{d.created}</td>

                                <td className="action-cell">
                                    <FaEllipsisV
                                        onClick={() => setMenu(menu === d.id ? null : d.id)}
                                    />

                                    {menu === d.id && (
                                        <div className="action-dropdown">
                                            <div onClick={() => setEditData(d)}>Edit</div>

                                            <div onClick={() => setViewData(d)}>View</div>

                                            <div onClick={() => approve(d.id)}>Approve</div>

                                            <div onClick={() => reject(d.id)}>Reject</div>

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
                        ))}
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
                            {(page - 1) * rows + 1}-{Math.min(page * rows, filtered.length)} of {filtered.length}
                        </span> */}
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

                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        Next
                    </button>
                </div>

            </div>

            {editData && (
                <div className="wd-modal-overlay">
                    <div className="wd-modal">

                        {/* HEADER */}
                        <div className="wd-header">
                            <h2>Edit Withdraw</h2>
                            <button onClick={() => setEditData(null)}>✕</button>
                        </div>

                        {/* BODY */}
                        <div className="wd-body">

                            {/* LEFT */}
                            <div className="wd-box">
                                <h4>To Details</h4>

                                <div className="wd-row">
                                    <span>User</span>
                                    <b>{editData.user || "-"}</b>
                                </div>

                                <div className="wd-row">
                                    <span>Wallet</span>
                                    <b>{editData.wallet || "-"}</b>
                                </div>
                            </div>

                            {/* RIGHT */}
                           

                            {/* FULL WIDTH */}
                            <div className="wd-box wd-full">

                                <h4>Transaction Details</h4>

                                <div className="wd-grid">

                                    <div>
                                        <span>Currency</span>
                                        <b>{editData.currency}</b>
                                    </div>

                                    <div>
                                        <span>Request</span>
                                        <b>${editData.amount?.toFixed(2)}</b>
                                    </div>

                                    <div>
                                        <span>Fee (10%)</span>
                                        <b>${editData.fee}</b>
                                    </div>

                                    <div>
                                        <span>Approved</span>
                                        <b>₹{editData.approved}</b>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <b className={`wd-status ${editData.status}`}>
                                            {editData.status}
                                        </b>
                                    </div>

                                    <div>
                                        <span>Created</span>
                                        <b>{editData.created}</b>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {viewData && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Withdraw Details</h3>
                            <button onClick={() => setViewData(null)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p><b>User:</b> {viewData.user}</p>
                            <p><b>Wallet:</b> {viewData.wallet}</p>
                            <p><b>Amount:</b> {viewData.amount}</p>
                            <p><b>Proof:</b> {viewData.proof}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteId && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Withdraw</h3>
                        <p>Are you sure you want to delete this request?</p>

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

export default WithdrawTransactions;