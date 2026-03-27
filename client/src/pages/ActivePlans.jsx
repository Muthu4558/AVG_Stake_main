import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";

const ActivePlans = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [plansData, setPlansData] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  /* ================= FETCH ================= */
  const fetchAllPlans = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get('http://localhost:5000/api/user-plans/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (res.data || []).map((item, index) => ({
        id: item.id, // ✅ IMPORTANT
        sno: index + 1,
        user: item.user || 'N/A',
        planName: item.plan_name || 'N/A',
        depositAmount: `$${item.amount ?? 0}`,
        dailyROI: `$${item.daily_roi ?? 0}`,
        status:
          String(item.status || '').toLowerCase() === 'active'
            ? 'Active'
            : 'Inactive',
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : '-',
      }));

      setPlansData(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to load plans ❌");
    }
  }, []);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  /* ================= ACTIONS ================= */
  const handleView = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setModalType('delete');
    setShowModal(true);
  };

  /* ================= STATUS CHANGE (API) ================= */
  const handleStatusChange = async (plan) => {
    try {
      const token = localStorage.getItem('token');

      const newStatus = plan.status === 'Active' ? 'inactive' : 'active';

      await axios.put(
        `http://localhost:5000/api/user-plans/${plan.id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`Status changed to ${newStatus} ✅`);
      fetchAllPlans();
    } catch (err) {
      console.error(err);
      toast.error("Status update failed ❌");
    }
  };

  /* ================= DELETE (API) ================= */
  const handleModalConfirm = async () => {
    try {
      const token = localStorage.getItem('token');

      if (modalType === 'delete' && selectedPlan) {
        await axios.delete(
          `http://localhost:5000/api/user-plans/${selectedPlan.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        toast.success("Plan deleted successfully 🗑️");
        fetchAllPlans();
      }

      setShowModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error(err);
      toast.error("Delete failed ❌");
    }
  };

  /* ================= FILTER ================= */
  const filteredData = plansData.filter(
    (item) =>
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  /* ================= MODAL ================= */
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="ap-modal-overlay">
        <div className="ap-modal">
          <div className="ap-modal-header">
            <h3>
              {modalType === 'delete'
                ? 'Confirm Delete'
                : modalType === 'edit'
                  ? 'Edit Plan'
                  : 'View Details'}
            </h3>
            <button
              className="ap-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
          </div>

          <div className="ap-modal-body">
            {modalType === 'delete' && (
              <p>
                Are you sure you want to delete the plan for{' '}
                {selectedPlan?.user}?
              </p>
            )}

            {modalType === 'edit' && (
              <div className="ap-edit-form">
                <div className="ap-form-group">
                  <label>User:</label>
                  <input type="text" defaultValue={selectedPlan?.user} />
                </div>
                <div className="ap-form-group">
                  <label>Plan Name:</label>
                  <input type="text" defaultValue={selectedPlan?.planName} />
                </div>
                <div className="ap-form-group">
                  <label>Deposit Amount:</label>
                  <input
                    type="text"
                    defaultValue={selectedPlan?.depositAmount}
                  />
                </div>
                <div className="ap-form-group">
                  <label>Daily ROI:</label>
                  <input type="text" defaultValue={selectedPlan?.dailyROI} />
                </div>
              </div>
            )}

            {modalType === 'view' && selectedPlan && (
              <div className="ap-view-details">
                {Object.entries(selectedPlan).map(([key, value]) => (
                  <div key={key} className="ap-detail-row">
                    <strong>{key}:</strong> <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ap-modal-footer">
            <button
              className="ap-modal-btn cancel"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

            {modalType === 'delete' && (
              <button
                className="ap-modal-btn confirm"
                onClick={handleModalConfirm}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ap-container">
      <div className="ap-header">
        <h1 className="ap-title">Active Plans List</h1>
        <div className="ap-search-box">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="ap-table-responsive">
        <table className="ap-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USER</th>
              <th>PLAN NAME</th>
              <th>DEPOSIT AMOUNT</th>
              <th>DAILY ROI</th>
              <th>STATUS</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.sno}</td>
                  <td>{plan.user}</td>
                  <td>{plan.planName}</td>
                  <td>{plan.depositAmount}</td>
                  <td>{plan.dailyROI}</td>
                  <td>
                    <span className={`ap-status-badge ${plan.status.toLowerCase()}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td>{plan.createdAt}</td>
                  <td>
                    <div className="ap-actions-dropdown">
                      <button className="ap-action-btn">:</button>
                      <div className="ap-actions-menu">
                        <button onClick={() => handleView(plan)}>👁️ View</button>
                        <button onClick={() => handleEdit(plan)}>✏️ Edit</button>
                        <button onClick={() => handleStatusChange(plan)}>
                          {plan.status === 'Active'
                            ? '⏸️ Deactivate'
                            : '▶️ Activate'}
                        </button>
                        <button onClick={() => handleDelete(plan)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="ap-no-data">
                  No active plans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ap-table-footer">
        <div className="ap-rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="ap-pagination">
          <button onClick={handlePrevious}>Previous</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => handlePageChange(i + 1)}>
              {i + 1}
            </button>
          ))}
          <button onClick={handleNext}>Next</button>
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default ActivePlans;