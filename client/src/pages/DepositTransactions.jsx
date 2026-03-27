import React, { useState, useMemo, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const DepositTransactions = () => {

    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState(5);
    const [menu, setMenu] = useState(null);

    const [viewData, setViewData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [showManualDeposit, setShowManualDeposit] = useState(false);

    const [selectedUser, setSelectedUser] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("");
    const [depositAmount, setDepositAmount] = useState("");

    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem("token");

            const [usersRes, plansRes] = await Promise.all([
                axios.get("http://localhost:5000/api/users/dropdown/users", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:5000/api/users/dropdown/plans", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setUsers(usersRes.data || []);
            setPlans(plansRes.data || []);

        } catch (err) {
            console.error("Dropdown fetch error:", err);
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchDropdownData(); // ✅ ADD THIS
    }, []);

    // ✅ FETCH ALL TRANSACTIONS FROM DB
    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                "http://localhost:5000/api/user-plans/all",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const formatted = (res.data || []).map((item) => ({
                id: item.id,
                user: item.user,
                hash: item.hash || `0x${Math.random().toString(36).substring(2, 10)}`,
                plan: item.plan_name,
                amount: `$${item.amount}`,
                created: item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "-"
            }));

            setData(formatted);

        } catch (err) {
            console.error("Fetch transactions error:", err);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // ✅ SEARCH FILTER
    const filtered = useMemo(() => {
        return data.filter(d =>
            d.user.toLowerCase().includes(search.toLowerCase()) ||
            d.hash.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, data]);

    // ✅ PAGINATION
    const totalPages = Math.ceil(filtered.length / rows);
    const paginated = filtered.slice((page - 1) * rows, page * rows);

    // ✅ MANUAL DEPOSIT (UI ONLY)
    const createDeposit = () => {
        if (!selectedUser || !selectedPlan || !depositAmount) {
            alert("Please fill all fields");
            return;
        }

        const newDeposit = {
            id: Date.now(),
            user: selectedUser,
            hash: `0x${Math.random().toString(36).substring(2, 10)}`,
            plan: selectedPlan,
            amount: `$${depositAmount}`,
            created: new Date().toLocaleString()
        };

        setData([newDeposit, ...data]);

        setShowManualDeposit(false);
        setSelectedUser("");
        setSelectedPlan("");
        setDepositAmount("");
    };

    // ✅ DELETE (UI ONLY)
    const confirmDelete = () => {
        setData(data.filter(d => d.id !== deleteId));
        setDeleteId(null);
    };

    // ✅ EDIT
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

            <div className="users-header">
                <div>
                    <h2>Transactions</h2>
                    <p>Deposit Management</p>
                </div>

                <div className="flex gap-3 items-center">
                    <button
                        className="tx-manual-deposit-btn"
                        onClick={() => setShowManualDeposit(true)}
                    >
                        + Manual Deposit
                    </button>

                    <input
                        placeholder="Search by user or hash"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-card">

                <h3 style={{ marginBottom: "15px" }}>Deposit List</h3>

                <table className="users-table">

                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>FROM USER</th>
                            <th>TRANSACTION HASH</th>
                            <th>PLAN NAME</th>
                            <th>AMOUNT</th>
                            <th>CREATED AT</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>

                        {paginated.length > 0 ? (
                            paginated.map((d, i) => (

                                <tr key={d.id}>

                                    <td>{(page - 1) * rows + i + 1}</td>
                                    <td>{d.user}</td>
                                    <td>{d.hash}</td>
                                    <td>{d.plan}</td>
                                    <td>{d.amount}</td>
                                    <td>{d.created}</td>

                                    <td className="action-cell">

                                        <FaEllipsisV
                                            onClick={() =>
                                                setMenu(menu === d.id ? null : d.id)
                                            }
                                        />

                                        {menu === d.id && (

                                            <div className="action-dropdown">

                                                <div onClick={() => setViewData(d)}>View</div>
                                                <div onClick={() => setEditData(d)}>Edit</div>
                                                <div className="delete" onClick={() => setDeleteId(d.id)}>Delete</div>

                                            </div>

                                        )}

                                    </td>

                                </tr>

                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>
                                    No transactions found
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            <div className="pagination">

                <div className="usrDeposit__rows">
                    Rows per page
                    <select
                        value={rows}
                        onChange={e => {
                            setRows(Number(e.target.value));
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

                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        Next
                    </button>

                </div>

            </div>

            {/* ALL YOUR MODALS REMAIN SAME (NO CHANGE) */}

            {/* VIEW MODAL */}
            {viewData && (

                <div className="modal-overlay">

                    <div className="modal-container">

                        <div className="modal-header">
                            <h3>Transaction Details</h3>
                            <button onClick={() => setViewData(null)}>✕</button>
                        </div>

                        <div className="modal-body">

                            <p><b>User:</b> {viewData.user}</p>
                            <p><b>Hash:</b> {viewData.hash}</p>
                            <p><b>Plan:</b> {viewData.plan}</p>
                            <p><b>Amount:</b> {viewData.amount}</p>

                        </div>

                    </div>

                </div>

            )}


            {/* edit modal */}
            {editData && (

                <div className="modal-overlay">

                    <div className="modal-container">

                        <div className="modal-header">
                            <h3>Edit Transaction</h3>
                            <button onClick={() => setEditData(null)}>✕</button>
                        </div>

                        <div className="modal-body">

                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    name="user"
                                    value={editData.user}
                                    onChange={handleEditChange}
                                />

                                <label>Plan Name</label>
                                <input
                                    name="plan"
                                    value={editData.plan}
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

                            <button onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>

                            <button className="btn-danger" onClick={confirmDelete}>
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* MANUAL DEPOSIT MODAL */}
            {showManualDeposit && (

                <div className="modal-overlay">

                    <div className="modal-container">

                        <div className="modal-header">
                            <h3>Manual Deposit</h3>
                            <button onClick={() => setShowManualDeposit(false)}>✕</button>
                        </div>

                        <div className="modal-body">

                            <div className="form-group">

                                <label>Select User</label>

                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Select User</option>

                                    {users.map((u) => (
                                        <option key={u.id} value={`${u.name} ${u.user_code}`}>
                                            {u.name} {u.user_code}
                                        </option>
                                    ))}

                                </select>

                            </div>


                            <div className="form-group">

                                <label>Select Plan</label>

                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                >

                                    <option value="">Select Plan</option>

                                    {plans.map((p) => (
                                        <option key={p.id} value={p.name}>
                                            {p.name}
                                        </option>
                                    ))}

                                </select>

                            </div>


                            <div className="form-group">

                                <label>Amount</label>

                                <input
                                    type="number"
                                    placeholder="Enter Amount"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                />

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button onClick={createDeposit}>
                                Create Deposit
                            </button>

                            <button onClick={() => setShowManualDeposit(false)}>
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
};

export default DepositTransactions;