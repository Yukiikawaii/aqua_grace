import { useState, useEffect } from "react";
import { getDashboardOverview } from "../../../lib/api";
import "./AdminHome.css";

interface StockItem { product_id: string; label: string; quantity: number; threshold: number; }
interface StaffStat { staff_id: number; staff_name: string; total_deliveries: number; week_deliveries: number; }
interface Complaint { id: number; order_id: number; consumer_name: string; complaint_type: string; }

interface Overview {
  ordersToday: number;
  pendingDeliveries: number;
  lowStockCount: number;
  lowStockItems: StockItem[];
  salesToday: number;
  unresolvedComplaints: number;
  complaints: Complaint[];
  staffStats: StaffStat[];
}

const WEEK_GOAL = 30;

function MiniWheel({ value, max, color }: { value: number; max: number; color: string }) {
  const size = 56;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(value / max, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e4e9f2" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
        strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize="13" fontWeight="700" fill="#0f2340" fontFamily="Sora,system-ui,sans-serif">
        {value}
      </text>
    </svg>
  );
}

function AdminHome() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardOverview()
      .then((data) => setOverview(data as Overview))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dateString = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="admin-home">
      <div className="admin-home__header">
        <div>
          <h1 className="admin-home__title">Dashboard</h1>
          <p className="admin-home__date">{dateString}</p>
        </div>
        <span className="admin-home__badge">Master Admin</span>
      </div>

      {loading ? (
        <div className="admin-home__loading">Loading overview…</div>
      ) : overview ? (
        <>
          {/* Complaint alert */}
          {overview.unresolvedComplaints > 0 && (
            <div className="admin-home__complaint-alert">
              <span className="admin-home__complaint-icon">⚠</span>
              <div>
                <strong>{overview.unresolvedComplaints} unresolved complaint{overview.unresolvedComplaints > 1 ? "s" : ""}</strong>
                <p>Go to Deliveries to review and resolve.</p>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="admin-home__stats">
            {[
              { label: "Orders Today", value: overview.ordersToday, accent: "blue" },
              { label: "Pending Deliveries", value: overview.pendingDeliveries, accent: "yellow" },
              { label: "Low Stock Alerts", value: overview.lowStockCount, accent: "red" },
              { label: "Sales Today", value: `₱${Number(overview.salesToday).toFixed(2)}`, accent: "green" },
            ].map((card) => (
              <div key={card.label} className={`stat-card stat-card--${card.accent}`}>
                <p className="stat-card__label">{card.label}</p>
                <p className="stat-card__value">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Low stock */}
          {overview.lowStockItems.length > 0 && (
            <div className="admin-home__section">
              <h2 className="admin-home__section-title">Low Stock Items</h2>
              <div className="admin-home__low-stock">
                {overview.lowStockItems.map((item) => (
                  <div key={item.product_id} className="low-stock-item">
                    <span className="low-stock-item__label">{item.label}</span>
                    <span className={`low-stock-item__qty ${item.quantity === 0 ? "low-stock-item__qty--out" : "low-stock-item__qty--low"}`}>
                      {item.quantity === 0 ? "Out of Stock" : `${item.quantity} units`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff progress wheels */}
          {overview.staffStats.length > 0 && (
            <div className="admin-home__section">
              <h2 className="admin-home__section-title">Staff Progress This Week</h2>
              <div className="admin-home__staff-wheels">
                {overview.staffStats.map((s) => (
                  <div key={s.staff_id} className="staff-wheel-card">
                    <MiniWheel value={s.week_deliveries} max={WEEK_GOAL} color="#2489da" />
                    <p className="staff-wheel-card__name">{s.staff_name.split(" ")[0]}</p>
                    <p className="staff-wheel-card__total">{s.total_deliveries} total</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="admin-home__loading">Could not load overview.</div>
      )}
    </div>
  );
}

export default AdminHome;
