import { useState, useEffect, type FormEvent } from "react";
import { listStaff, addStaff, toggleStaff, getAllStaffStats, changeAdminPassword, ApiError } from "../../../lib/api";
import "./AdminAccount.css";

interface StaffMember { id: number; full_name: string; email: string; phone: string; is_active: boolean; }
interface StaffStat { staff_id: number; staff_name: string; total_deliveries: number; week_deliveries: number; }

const WEEK_GOAL = 30;
const TOTAL_MAX = 200;

function Wheel({ value, max, color, size = 80 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(value / max, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e4e9f2" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth="8" strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize="15" fontWeight="700" fill="#0f2340" fontFamily="Sora,system-ui,sans-serif">
        {value}
      </text>
    </svg>
  );
}

function AdminAccount() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStat[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add staff form
  const [newName, setNewName] = useState(""); const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null); const [addBusy, setAddBusy] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState(""); const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null); const [pwBusy, setPwBusy] = useState(false);

  const loadData = async () => {
    try {
      const [staffData, statsData] = await Promise.all([
        listStaff() as Promise<{ staff: StaffMember[] }>,
        getAllStaffStats() as Promise<{ stats: StaffStat[] }>,
      ]);
      setStaff(staffData.staff ?? []);
      setStats(statsData.stats ?? []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault(); setAddError(null);
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim() || !newPassword) {
      setAddError("All fields are required."); return;
    }
    setAddBusy(true);
    try {
      await addStaff({ fullName: newName.trim(), email: newEmail.trim(), phone: newPhone.trim(), password: newPassword });
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewPassword("");
      setShowAddForm(false);
      await loadData();
    } catch (err) { setAddError(err instanceof ApiError ? err.message : "Something went wrong."); }
    finally { setAddBusy(false); }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try { await toggleStaff(id, !isActive); await loadData(); } catch { /* silent */ }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault(); setPwError(null); setPwSuccess(null);
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwBusy(true);
    try {
      await changeAdminPassword({ adminId: 1, currentPassword: currentPw, newPassword: newPw });
      setPwSuccess("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) { setPwError(err instanceof ApiError ? err.message : "Something went wrong."); }
    finally { setPwBusy(false); }
  };

  const getStaffStat = (staffId: number) => stats.find((s) => s.staff_id === staffId);

  return (
    <div className="admin-account">

      {/* Profile */}
      <section className="account-section">
        <h2 className="account-section__title">Profile</h2>
        <div className="account-profile">
          <div className="account-profile__avatar">M</div>
          <div>
            <p className="account-profile__name">Master Admin</p>
            <p className="account-profile__email">masteradmin@gmail.com</p>
            <span className="account-profile__badge">Master Admin</span>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section className="account-section">
        <h2 className="account-section__title">Change Password</h2>
        <form className="account-form" onSubmit={handlePasswordChange} noValidate>
          {[
            { id: "cur-pw", label: "Current Password", val: currentPw, set: setCurrentPw, auto: "current-password" },
            { id: "new-pw", label: "New Password", val: newPw, set: setNewPw, auto: "new-password" },
            { id: "con-pw", label: "Confirm New Password", val: confirmPw, set: setConfirmPw, auto: "new-password" },
          ].map((f) => (
            <div key={f.id} className="account-form__field">
              <label htmlFor={f.id}>{f.label}</label>
              <input id={f.id} type="password" value={f.val} onChange={(e) => f.set(e.target.value)} autoComplete={f.auto} />
            </div>
          ))}
          {pwError && <p className="account-form__error" role="alert">{pwError}</p>}
          {pwSuccess && <p className="account-form__success" role="status">{pwSuccess}</p>}
          <button type="submit" className="account-form__submit" disabled={pwBusy}>
            {pwBusy ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>

      {/* Delivery staff */}
      <section className="account-section">
        <div className="account-section__header">
          <h2 className="account-section__title" style={{ borderBottom: "none", paddingBottom: 0 }}>Delivery Staff</h2>
          <button type="button" className="account-section__action" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {showAddForm && (
          <form className="account-form account-form--card" onSubmit={handleAddStaff} noValidate>
            {[
              { id: "sf-name", label: "Full Name", val: newName, set: setNewName, type: "text", auto: "name" },
              { id: "sf-email", label: "Email", val: newEmail, set: setNewEmail, type: "email", auto: "email" },
              { id: "sf-phone", label: "Phone", val: newPhone, set: setNewPhone, type: "tel", auto: "tel" },
              { id: "sf-pw", label: "Password", val: newPassword, set: setNewPassword, type: "password", auto: "new-password" },
            ].map((f) => (
              <div key={f.id} className="account-form__field">
                <label htmlFor={f.id}>{f.label}</label>
                <input id={f.id} type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} autoComplete={f.auto} />
              </div>
            ))}
            {addError && <p className="account-form__error" role="alert">{addError}</p>}
            <button type="submit" className="account-form__submit" disabled={addBusy}>
              {addBusy ? "Adding…" : "Add Staff Member"}
            </button>
          </form>
        )}

        {staff.length === 0 ? (
          <div className="account-empty">No delivery staff added yet.</div>
        ) : (
          <div className="staff-list">
            {staff.map((s) => {
              const stat = getStaffStat(s.id);
              return (
                <div key={s.id} className="staff-card">
                  <div className="staff-card__avatar">{s.full_name.charAt(0)}</div>
                  <div className="staff-card__info">
                    <p className="staff-card__name">{s.full_name}</p>
                    <p className="staff-card__email">{s.email}</p>
                    <p className="staff-card__phone">{s.phone}</p>
                  </div>
                  {stat && (
                    <div className="staff-card__wheels">
                      <div className="staff-card__wheel-wrap">
                        <Wheel value={stat.week_deliveries} max={WEEK_GOAL} color="#2489da" size={72} />
                        <span className="staff-card__wheel-label">Week</span>
                      </div>
                      <div className="staff-card__wheel-wrap">
                        <Wheel value={stat.total_deliveries} max={TOTAL_MAX} color="#7fe0b0" size={72} />
                        <span className="staff-card__wheel-label">Total</span>
                      </div>
                    </div>
                  )}
                  <button type="button"
                    className={`staff-card__toggle ${s.is_active ? "staff-card__toggle--active" : "staff-card__toggle--inactive"}`}
                    onClick={() => handleToggle(s.id, s.is_active)}>
                    {s.is_active ? "Active" : "Disabled"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminAccount;
