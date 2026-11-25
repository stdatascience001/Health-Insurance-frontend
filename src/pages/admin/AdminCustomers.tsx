import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminCustomers,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CustomerUpdate,
} from "../../services/customerservices";

const CUSTOMER_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
];

function getCustomerAvatar(index: number) {
  return CUSTOMER_AVATARS[index % CUSTOMER_AVATARS.length];
}

function getInitials(name: string) {
  if (!name) return "AB";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const AdminCustomers: React.FC = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Edit Customer Modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  //For the pagination 
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;


  const loadCustomers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getAdminCustomers(token);
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError(err instanceof Error ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [token]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchQuery =
        !q ||
        customer.full_name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        (customer.phone || "").includes(q) ||
        customer.id.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (statusFilter === "With Phone") return Boolean(customer.phone);
      if (statusFilter === "Email Verified") return customer.email.includes("@");

      return true;
    });
  }, [customers, query, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage]);

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditName(cust.full_name);
    setEditEmail(cust.email);
    setEditPhone(cust.phone || "");
  };

  const handleUpdateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !editingCustomer) return;

    try {
      setSavingEdit(true);
      setError("");

      const payload: CustomerUpdate = {
        full_name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || null,
      };

      const res = await updateCustomer(token, editingCustomer.id, payload);

      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? res.customer : c))
      );

      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(res.customer);
      }

      setEditingCustomer(null);
      setSuccessToast(`Customer "${res.customer.full_name}" updated successfully.`);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error("Failed to update customer:", err);
      setError(err instanceof Error ? err.message : "Failed to update customer.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove customer "${cust.full_name}"?`
    );
    if (!confirmed) return;

    try {
      setError("");
      await deleteCustomer(token, cust.id);
      setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
      if (selectedCustomer?.id === cust.id) {
        setSelectedCustomer(null);
      }
      setSuccessToast(`Customer "${cust.full_name}" deleted successfully.`);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error("Failed to delete customer:", err);
      setError(err instanceof Error ? err.message : "Failed to delete customer.");
    }
  };

  return (
    <div className="main-content">
      <div className="view-header">
        <div className="view-title-wrap">
          <span className="view-eyebrow">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-emerald)",
              }}
            />
            Authorized Administrative View
          </span>
          <h1 className="view-title">Individual Customers Directory</h1>
          <p className="view-description">
            Complete database of registered individual policyholders with management actions.
          </p>
        </div>

        <div className="view-actions">
          <button className="secondary-btn" onClick={loadCustomers} disabled={loading}>
            {loading ? "Syncing..." : "Refresh Records"}
          </button>
        </div>
      </div>

      {successToast && (
        <div className="toast-banner success">
          <span>✓ {successToast}</span>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            onClick={() => setSuccessToast("")}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="toast-banner error">
          <span>⚠ {error}</span>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="metrics-strip">
        <div className="metric-strip-card">
          <div className="metric-icon-box teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">Total Policyholders</span>
            <span className="metric-strip-value">{customers.length}</span>
            <span className="metric-strip-sub">Active in database</span>
          </div>
        </div>

        <div className="metric-strip-card">
          <div className="metric-icon-box emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">With Phone Number</span>
            <span className="metric-strip-value">
              {customers.filter((c) => Boolean(c.phone)).length}
            </span>
            <span className="metric-strip-sub">Direct contactable</span>
          </div>
        </div>

        <div className="metric-strip-card">
          <div className="metric-icon-box blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="metric-strip-info">
            <span className="metric-strip-label">Filtered Customers</span>
            <span className="metric-strip-value">{filteredCustomers.length}</span>
            <span className="metric-strip-sub">Matches current view</span>
          </div>
        </div>
      </div>

      {/* CUSTOMER TABLE CARD */}
      <div className="content-card">
        <div className="table-toolbar">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="search-input"
              placeholder="Search customers by name, email, phone, or ID..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-pills">
            {["All", "With Phone", "Email Verified"].map((pill) => (
              <button
                key={pill}
                type="button"
                className={`filter-pill ${statusFilter === pill ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(pill);
                  setCurrentPage(1);
                }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Individual Customer</th>
                <th>Email Contact</th>
                <th>Phone Number</th>
                <th>Registration Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-state">
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          border: "3px solid var(--border-light)",
                          borderTopColor: "var(--primary-600)",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          marginBottom: "0.75rem",
                        }}
                      />
                      Loading customer records...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => {
                  const avatarUrl = getCustomerAvatar(index);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      title="Click to view customer details"
                    >
                      <td>
                        <div className="customer-profile-cell">
                          <div className="avatar-container">
                            <img
                              src={avatarUrl}
                              alt={customer.full_name}
                              className="avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="avatar-fallback">{getInitials(customer.full_name)}</div>
                          </div>
                          <div className="customer-names">
                            <span className="customer-name">{customer.full_name}</span>
                            <span className="customer-meta-small">ID: {customer.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <a
                          href={`mailto:${customer.email}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {customer.email}
                        </a>
                      </td>

                      <td>
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "var(--primary-600)", textDecoration: "none", fontWeight: 600 }}
                          >
                            {customer.phone}
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-light)" }}>—</span>
                        )}
                      </td>

                      <td>
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          {/* VIEW DETAILS */}
                          <button
                            type="button"
                            className="table-action-btn"
                            title="View details"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {/* EDIT CUSTOMER */}
                          <button
                            type="button"
                            className="table-action-btn"
                            title="Edit customer"
                            onClick={() => openEditModal(customer)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>

                          {/* DELETE CUSTOMER */}
                          <button
                            type="button"
                            className="table-action-btn"
                            title="Delete customer"
                            style={{ color: "var(--accent-rose)" }}
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-state">
                      <div className="empty-illustration">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "4px" }}>
                        {customers.length === 0 ? "No customers registered yet" : "No matching customers"}
                      </h3>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        {customers.length === 0
                          ? "Customers registered through customer signup will appear here."
                          : `No customers match query "${query}".`}
                      </p>
                      {query && (
                        <button className="secondary-btn" onClick={() => setQuery("")}>
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing{" "}
            <strong>
              {filteredCustomers.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(currentPage * pageSize, filteredCustomers.length)}
            </strong>{" "}
            of <strong>{filteredCustomers.length}</strong> customers
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOMER DETAILS DRAWER */}
      {selectedCustomer && (
        <div className="drawer-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--primary-600)", fontWeight: 800, textTransform: "uppercase" }}>
                  Policyholder Details
                </span>
                <strong style={{ fontSize: "1.1rem" }}>{selectedCustomer.full_name}</strong>
              </div>
              <button
                className="modal-close-btn"
                style={{ color: "var(--text-main)", background: "#f0f4f3" }}
                onClick={() => setSelectedCustomer(null)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-profile-hero">
                <div className="drawer-avatar-lg">
                  <img
                    src={getCustomerAvatar(0)}
                    alt={selectedCustomer.full_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800 }}>
                  {selectedCustomer.full_name}
                </h3>
                <span className="single-coverage-tag" style={{ marginTop: "6px" }}>
                  Individual Customer
                </span>
              </div>

              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <span className="drawer-info-label">Customer ID</span>
                  <span className="drawer-info-val" style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                    {selectedCustomer.id}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Email Address</span>
                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="drawer-info-val"
                    style={{ color: "var(--primary-600)", textDecoration: "none" }}
                  >
                    {selectedCustomer.email}
                  </a>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Phone Number</span>
                  <span className="drawer-info-val">
                    {selectedCustomer.phone || "Not Provided"}
                  </span>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Registration Date</span>
                  <span className="drawer-info-val">
                    {selectedCustomer.created_at
                      ? new Date(selectedCustomer.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => openEditModal(selectedCustomer)}
                >
                  Edit Customer Profile
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => window.open(`mailto:${selectedCustomer.email}`)}
                >
                  Send Customer Email
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    color: "var(--accent-rose)",
                    borderColor: "#fecaca",
                  }}
                  onClick={() => handleDeleteCustomer(selectedCustomer)}
                >
                  Delete Customer Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="modal-backdrop" onClick={() => !savingEdit && setEditingCustomer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-banner">
              <div className="modal-header-top">
                <span className="modal-badge">Customer Edit</span>
                <button
                  className="modal-close-btn"
                  onClick={() => setEditingCustomer(null)}
                  disabled={savingEdit}
                >
                  ✕
                </button>
              </div>
              <h2 className="modal-title">Update Customer Information</h2>
              <p className="modal-subtitle">Modify contact and profile details.</p>
            </div>

            <form className="modal-form" onSubmit={handleUpdateCustomer}>
              <div className="form-field">
                <label className="form-label">
                  <span>Full Legal Name</span>
                  <span className="label-required">* Required</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <span>Email Address</span>
                  <span className="label-required">* Required</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingCustomer(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
