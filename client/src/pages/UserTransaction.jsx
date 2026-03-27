import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserTransaction = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const token = localStorage.getItem("token");

  // ✅ FETCH FROM BACKEND
  const fetchTransactions = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/user-plans/transactions",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const formatted = (res.data || []).map((item) => ({
        id: item.id,
        from: item.from_user,
        fromId: item.from_id,
        to: item.to_user,
        toId: item.to_id,
        type: item.type,
        amount: `$${Number(item.amount).toFixed(2)}`,
        date: new Date(item.created_at).toLocaleString(),
      }));

      setData(formatted);

    } catch (err) {
      console.error("Transaction fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ SEARCH
  const filtered = useMemo(() => {
    return data.filter(item =>
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.from.toLowerCase().includes(search.toLowerCase()) ||
      item.to.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  return (
    <div className="utxLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="utxContent">

          <div className="utxFirstContent">
            <h2 className="utxTitle">Transaction List</h2>

          <div className="utxSearch">
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          </div>

          <div className="utxTableWrapper">
            <table className="utxTable">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6">No transactions</td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <p>{item.from}</p>
                        <span>{item.fromId}</span>
                      </td>

                      <td>
                        <p>{item.to}</p>
                        <span>{item.toId}</span>
                      </td>

                      <td>{item.type}</td>
                      <td className="utxAmount">{item.amount}</td>
                      <td>{item.date}</td>
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
    </div>
  );
};

export default UserTransaction;