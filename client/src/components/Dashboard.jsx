import React, { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/users/admin/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setData(res.data);

      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <div className="content">Loading...</div>;

  return (
    <div className="content">
      <h1 className="page-title">Dashboard</h1>
      <p className="subtitle">Overview of your account activity</p>

      {/* USERS */}
      <h2 className="section-title">Users</h2>
      <div className="grid-3">
        <StatCard title="Total Users" value={data.users.total} />
        <StatCard title="Active Users" value={data.users.active} />
        <StatCard title="Inactive Users" value={data.users.inactive} />
      </div>

      {/* TRANSACTIONS */}
      <h2 className="section-title">Transactions Overview</h2>
      <div className="grid-2">

        <SectionCard title="Deposits Overview">
          <div className="inner-grid">
            <StatCard title="Total Deposits" value={data.deposits.total_count} small />
            <StatCard title="Total Amount" value={`$${data.deposits.total_amount}`} small />
            <StatCard title="Today Deposits" value={data.deposits.today_count} small />
            <StatCard title="Today Amount" value={`$${data.deposits.today_amount}`} small />
          </div>
        </SectionCard>

        <SectionCard title="Withdraw Overview">
          <div className="inner-grid">
            <StatCard title="Count" value={data.withdrawals.total_count} small />
            <StatCard title="Amount" value={`$${data.withdrawals.total_amount}`} small />
            <StatCard title="Pending" value={data.withdrawals.pending} small />
            <StatCard title="Withdraw Fee" value="$0.00" small />
          </div>
        </SectionCard>

      </div>

      {/* INCOME */}
      <h2 className="section-title">Income</h2>
      <div className="grid-3">
        <StatCard title="ROI Income" value={`$${data.income.roi}`} />
        <StatCard title="Level Income" value={`$${data.income.level}`} />
        <StatCard title="Direct Income" value={`$${data.income.direct}`} />
      </div>

      {/* SUPPORT */}
      <h2 className="section-title">Support Tickets</h2>
      <div className="grid-3">
        <StatCard title="Open Tickets" value={data.tickets.open} />
        <StatCard title="In Progress" value={data.tickets.progress} />
        <StatCard title="Closed Tickets" value={data.tickets.closed} />
      </div>
    </div>
  );
};

export default Dashboard;