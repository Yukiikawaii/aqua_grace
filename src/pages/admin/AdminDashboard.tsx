import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import AdminHome from "./sections/AdminHome";
import AdminOrders from "./sections/AdminOrders";
import AdminDeliveries from "./sections/AdminDeliveries";
import AdminStocks from "./sections/AdminStocks";
import AdminSales from "./sections/AdminSales";
import AdminAccount from "./sections/AdminAccount";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="admin-shell__body">
        <header className="admin-topbar">
          <button type="button" className="admin-topbar__menu" aria-label="Open menu"
            aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="admin-topbar__brand">Aqua Grace</span>
        </header>
        <main className="admin-content">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="deliveries" element={<AdminDeliveries />} />
            <Route path="stocks" element={<AdminStocks />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="account" element={<AdminAccount />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
