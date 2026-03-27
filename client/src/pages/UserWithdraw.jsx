import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserWithdraw = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [wallets, setWallets] = useState({
    roi: 0,
    level: 0,
    directReferral: 0,
    reward: 0,
    usdtPrice: 0,
  });

  const [form, setForm] = useState({
    walletType: "",
    currencyType: "",
    amount: "",
  });

  const [errors, setErrors] = useState({});
  const token = localStorage.getItem("token");

  // ✅ FETCH DATA
  const fetchData = async () => {
    try {
      const [summaryRes, withdrawRes] = await Promise.all([
        axios.get("http://localhost:5000/api/withdrawals/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/withdrawals/my", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setWallets(summaryRes.data);

      const formatted = (withdrawRes.data || []).map((w) => ({
        id: w.id,
        currency: w.currency_type,
        proof: w.transaction_proof || "-",
        request: `$${Number(w.amount).toFixed(2)}`,
        approved: `$${Number(w.approved_amount).toFixed(2)}`,
        status: w.status,
        date: new Date(w.created_at).toLocaleString(),
      }));

      setData(formatted);

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ VALIDATION
  const validate = () => {
    const newErrors = {};
    const amount = Number(form.amount);

    if (!form.walletType) newErrors.walletType = "Wallet required";
    if (!form.currencyType) newErrors.currencyType = "Currency required";

    if (!form.amount) newErrors.amount = "Amount required";
    else if (amount < 20) newErrors.amount = "Minimum $20";
    else {
      const balance = wallets[form.walletType] || 0;
      if (amount > balance) newErrors.amount = "Insufficient balance";
    }

    return newErrors;
  };

  // ✅ SUBMIT
  const handleSubmit = async () => {
    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/withdrawals",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowModal(false);
      setForm({ walletType: "", currencyType: "", amount: "" });
      setErrors({});
      fetchData();

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // ✅ FILTER
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).join("").toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  return (
    <div className="uwLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="uwContent">

          {/* HEADER */}
          <div className="uwHeader">
            <h2 className="usrDeposit__title">Withdraw</h2>
            <button onClick={() => setShowModal(true)}>
              Create Withdraw
            </button>
          </div>

          {/* SEARCH */}
          <div className="uwSearch">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>

          {/* TABLE */}
          <div className="uwTableWrapper">
            <table className="uwTable">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>CURRENCY</th>
                  <th>TRANSACTION PROOF</th>
                  <th>REQUEST AMOUNT</th>
                  <th>APPROVED AMOUNT</th>
                  <th>STATUS</th>
                  <th>CREATED AT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8">No available options</td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.currency}</td>
                      <td className="uwHash">{item.proof}</td>
                      <td>{item.request}</td>
                      <td>{item.approved}</td>
                      <td className="uwStatus">{item.status}</td>
                      <td>{item.date}</td>
                      <td>⋮</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="usrDeposit__footer">
            <div className="usrDeposit__rows">
              Rows:
              <select>
                <option>10</option>
                <option>25</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">
              <button>{"< Prev"}</button>
              <button className="active">1</button>
              <button>{"Next >"}</button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="uw2Overlay">
          <div className="uw2Modal">

            <div className="uw2Header">
              <h3>Create Withdraw</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="uw2Price">
              Live USDT Price: ${wallets.usdtPrice}
            </div>

            {/* STATS */}
            <div className="uw2Stats">
              <div><p>ROI</p><h4>${wallets.roi}</h4></div>
              <div><p>Level</p><h4>${wallets.level}</h4></div>
              <div><p>Direct</p><h4>${wallets.directReferral}</h4></div>
              <div><p>Reward</p><h4>${wallets.reward}</h4></div>
            </div>

            {/* FORM */}
            <div className="uw2Form">

              <div className="uw2Field">
                <label>Wallet Type</label>
                <select
                  value={form.walletType}
                  onChange={(e) =>
                    setForm({ ...form, walletType: e.target.value })
                  }
                >
                  <option value="">Select Wallet</option>
                  <option value="roi">ROI (${wallets.roi})</option>
                  <option value="level">Level (${wallets.level})</option>
                  <option value="directReferral">
                    Direct (${wallets.directReferral})
                  </option>
                  <option value="reward">Reward (${wallets.reward})</option>
                </select>
                <span className="error">{errors.walletType}</span>
              </div>

              <div className="uw2Field">
                <label>Currency</label>
                <select
                  value={form.currencyType}
                  onChange={(e) =>
                    setForm({ ...form, currencyType: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="INR">INR</option>
                  <option value="USDT">USDT</option>
                </select>
                <span className="error">{errors.currencyType}</span>
              </div>

              <div className="uw2Field">
                <label>Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
                <span className="error">{errors.amount}</span>
              </div>

            </div>

            {/* NOTES */}
            <div className="uw2Notes">
              <h4>Withdraw Notes</h4>
              <ul>
                <li>Minimum withdrawal is <b>$20</b></li>
                <li>Ensure wallet balance is sufficient</li>
                <li>Approval may take some time</li> </ul>
            </div>

            <div className="uw2Footer">
              <button className="uw2Cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="uw2Submit" onClick={handleSubmit}>Create Withdraw</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default UserWithdraw;