import { useState, useEffect, type FormEvent } from "react";
import { loginStaff, getStaffDeliveries, confirmDelivery, fileComplaint, ApiError } from "../../lib/api";
import "./StaffDashboard.css";

interface Delivery {
  id: number;
  order_id: number;
  status: string;
  consumer_name: string;
  consumer_phone: string;
  consumer_address: string;
  total: number;
  assigned_at: string;
  delivered_at: string | null;
  has_complaint: boolean;
  complaint_type: string | null;
  complaint_resolved: boolean;
  sms_sent_at: string | null;
}

interface StaffStats {
  staff_id: number;
  staff_name: string;
  total_deliveries: number;
  week_deliveries: number;
}

const WEEK_GOAL = 30;
const TOTAL_MAX = 200;

function ProgressWheel({
  label,
  value,
  max,
  color,
  size = 120,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="progress-wheel">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e4e9f2"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="20"
          fontWeight="700"
          fill="#0f2340"
          fontFamily="Sora, system-ui, sans-serif"
        >
          {value}
        </text>
      </svg>
      <p className="progress-wheel__label">{label}</p>
    </div>
  );
}

function StaffDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Complaint form
  const [complaintDeliveryId, setComplaintDeliveryId] = useState<number | null>(null);
  const [complaintType, setComplaintType] = useState("damaged");
  const [complaintNote, setComplaintNote] = useState("");
  const [complaintBusy, setComplaintBusy] = useState(false);

  const loadData = async (id: number) => {
    setLoading(true);
    try {
      const data = await getStaffDeliveries(id) as { deliveries: Delivery[]; stats: StaffStats };
      setDeliveries(data.deliveries ?? []);
      setStats(data.stats ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email.trim() || !password) { setLoginError("Enter your email and password."); return; }
    setLoginBusy(true);
    try {
      const result = await loginStaff({ email: email.trim(), password }) as { staffId: number; fullName: string };
      setStaffId(result.staffId);
      setStaffName(result.fullName);
      setIsLoggedIn(true);
      await loadData(result.staffId);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleConfirm = async (deliveryId: number) => {
    try {
      await confirmDelivery(deliveryId);
      if (staffId) await loadData(staffId);
    } catch { /* silent */ }
  };

  const handleComplaintSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!complaintDeliveryId) return;
    setComplaintBusy(true);
    try {
      await fileComplaint(complaintDeliveryId, { complaintType, note: complaintNote });
      setComplaintDeliveryId(null);
      setComplaintNote("");
      if (staffId) await loadData(staffId);
    } catch { /* silent */ }
    finally { setComplaintBusy(false); }
  };

  const activeDeliveries = deliveries.filter((d) => d.status !== "delivered" && !d.complaint_resolved);
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered" || d.complaint_resolved);

  if (!isLoggedIn) {
    return (
      <div className="staff-login">
        <div className="staff-login__card">
          <p className="staff-login__eyebrow">Delivery Staff</p>
          <h1 className="staff-login__title">Sign In</h1>
          <form onSubmit={handleLogin} noValidate className="staff-login__form">
            <div className="staff-login__field">
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="staff-login__field">
              <label htmlFor="staff-password">Password</label>
              <div className="staff-login__pw-wrap">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {loginError && <p className="staff-login__error" role="alert">{loginError}</p>}
            <button type="submit" className="staff-login__submit" disabled={loginBusy}>
              {loginBusy ? "Signing In…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">

      {/* Header */}
      <div className="staff-header">
        <div className="staff-header__inner">
          <div>
            <p className="staff-header__eyebrow">Delivery Staff</p>
            <h1 className="staff-header__name">{staffName}</h1>
          </div>
          <button
            type="button"
            className="staff-header__signout"
            onClick={() => { setIsLoggedIn(false); setStaffId(null); setDeliveries([]); setStats(null); }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="staff-body">

        {/* Progress wheels */}
        {stats && (
          <section className="staff-section">
            <h2 className="staff-section__title">Your Progress</h2>
            <div className="staff-wheels">
              <ProgressWheel
                label="This Week"
                value={stats.week_deliveries}
                max={WEEK_GOAL}
                color="#2489da"
                size={130}
              />
              <ProgressWheel
                label="All Time"
                value={stats.total_deliveries}
                max={TOTAL_MAX}
                color="#7fe0b0"
                size={130}
              />
            </div>
            <div className="staff-stats">
              <div className="staff-stat">
                <span className="staff-stat__value">{stats.week_deliveries}</span>
                <span className="staff-stat__label">This week</span>
              </div>
              <div className="staff-stat">
                <span className="staff-stat__value">{stats.total_deliveries}</span>
                <span className="staff-stat__label">All time</span>
              </div>
            </div>
          </section>
        )}

        {/* Active deliveries */}
        <section className="staff-section">
          <h2 className="staff-section__title">Active Deliveries</h2>
          {loading ? (
            <div className="staff-loading">Loading…</div>
          ) : activeDeliveries.length === 0 ? (
            <div className="staff-empty">No active deliveries assigned to you.</div>
          ) : (
            <div className="staff-deliveries">
              {activeDeliveries.map((d) => (
                <div key={d.id} className={`staff-delivery-card ${d.has_complaint ? "staff-delivery-card--complaint" : ""}`}>
                  <div className="sdc__header">
                    <div>
                      <p className="sdc__id">Delivery #{d.id} · Order #{d.order_id}</p>
                      <p className="sdc__name">{d.consumer_name}</p>
                      <p className="sdc__phone">{d.consumer_phone}</p>
                      <p className="sdc__address">📍 {d.consumer_address}</p>
                    </div>
                    <div className="sdc__right">
                      <span className={`sdc__status sdc__status--${d.status}`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                      <p className="sdc__total">₱{Number(d.total).toFixed(2)}</p>
                    </div>
                  </div>

                  {d.has_complaint && !d.complaint_resolved && (
                    <div className="sdc__complaint-flag">
                      ⚠ Complaint filed — {d.complaint_type?.replace(/_/g, " ")}. Awaiting admin resolution.
                    </div>
                  )}

                  {!d.has_complaint && d.status === "out_for_delivery" && (
                    <div className="sdc__actions">
                      <button
                        type="button"
                        className="sdc__btn sdc__btn--primary"
                        onClick={() => handleConfirm(d.id)}
                      >
                        Mark as Delivered
                      </button>
                      <button
                        type="button"
                        className="sdc__btn sdc__btn--danger"
                        onClick={() => setComplaintDeliveryId(d.id)}
                      >
                        File Complaint
                      </button>
                    </div>
                  )}

                  {/* Complaint form */}
                  {complaintDeliveryId === d.id && (
                    <form className="sdc__complaint-form" onSubmit={handleComplaintSubmit} noValidate>
                      <p className="sdc__complaint-title">File a Complaint</p>
                      <div className="sdc__complaint-field">
                        <label>Issue Type</label>
                        <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)}>
                          <option value="wrong_item">Wrong Item</option>
                          <option value="damaged">Damaged Container</option>
                          <option value="incomplete">Incomplete Order</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="sdc__complaint-field">
                        <label>Note (optional)</label>
                        <textarea
                          value={complaintNote}
                          onChange={(e) => setComplaintNote(e.target.value)}
                          rows={3}
                          placeholder="Describe the issue…"
                        />
                      </div>
                      <div className="sdc__actions">
                        <button type="submit" className="sdc__btn sdc__btn--danger" disabled={complaintBusy}>
                          {complaintBusy ? "Submitting…" : "Submit Complaint"}
                        </button>
                        <button type="button" className="sdc__btn" onClick={() => setComplaintDeliveryId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed deliveries */}
        <section className="staff-section">
          <h2 className="staff-section__title">Completed Deliveries</h2>
          {completedDeliveries.length === 0 ? (
            <div className="staff-empty">No completed deliveries yet.</div>
          ) : (
            <div className="staff-deliveries">
              {completedDeliveries.map((d) => (
                <div key={d.id} className="staff-delivery-card staff-delivery-card--done">
                  <div className="sdc__header">
                    <div>
                      <p className="sdc__id">Delivery #{d.id} · Order #{d.order_id}</p>
                      <p className="sdc__name">{d.consumer_name}</p>
                      <p className="sdc__address">📍 {d.consumer_address}</p>
                    </div>
                    <div className="sdc__right">
                      <span className="sdc__status sdc__status--delivered">Delivered</span>
                      <p className="sdc__total">₱{Number(d.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default StaffDashboard;
