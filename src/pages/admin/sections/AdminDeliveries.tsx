import { useState, useEffect } from "react";
import {
  listDeliveries, listComplaints, dispatchDelivery,
  resolveComplaint, ApiError
} from "../../../lib/api";
import "./AdminDeliveries.css";

interface Delivery {
  id: number; order_id: number; staff_id: number; staff_name: string;
  status: string; consumer_name: string; consumer_phone: string;
  consumer_address: string; total: number; assigned_at: string;
  delivered_at: string | null; sms_sent_at: string | null;
  has_complaint: boolean; complaint_type: string | null;
  complaint_note: string | null; complaint_resolved: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  assigned: "Assigned", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", complaint: "Complaint",
};

function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [complaints, setComplaints] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delData, compData] = await Promise.all([
        listDeliveries() as Promise<{ deliveries: Delivery[] }>,
        listComplaints() as Promise<{ complaints: Delivery[] }>,
      ]);
      setDeliveries(delData.deliveries ?? []);
      setComplaints(compData.complaints ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDispatch = async (id: number) => {
    setActionBusy(id);
    try {
      const result = await dispatchDelivery(id) as { message: string };
      setMessage(result.message);
      await loadData();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setActionBusy(null); }
  };

  const handleResolve = async (id: number) => {
    setActionBusy(id);
    try {
      await resolveComplaint(id);
      setMessage("Complaint resolved and sale recorded.");
      await loadData();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setActionBusy(null); }
  };

  const filtered = filter === "all" ? deliveries : deliveries.filter((d) => d.status === filter);

  return (
    <div className="admin-deliveries">
      <div className="admin-deliveries__header">
        <div>
          <h1 className="admin-deliveries__title">Deliveries</h1>
          <p className="admin-deliveries__sub">Track and manage all delivery assignments.</p>
        </div>
      </div>

      {message && (
        <div className="admin-deliveries__message" role="status">
          {message}
          <button type="button" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* Complaint alerts — always at top */}
      {complaints.length > 0 && (
        <div className="admin-deliveries__complaints">
          <div className="complaints-header">
            <span className="complaints-header__icon">⚠</span>
            <h2 className="complaints-header__title">
              {complaints.length} Unresolved Complaint{complaints.length > 1 ? "s" : ""}
            </h2>
          </div>
          <div className="complaints-list">
            {complaints.map((c) => (
              <div key={c.id} className="complaint-card">
                <div className="complaint-card__header">
                  <div>
                    <p className="complaint-card__id">Delivery #{c.id} · Order #{c.order_id}</p>
                    <p className="complaint-card__consumer">{c.consumer_name} · {c.consumer_phone}</p>
                    <p className="complaint-card__staff">Staff: {c.staff_name}</p>
                  </div>
                  <div className="complaint-card__right">
                    <span className="complaint-card__type">
                      {c.complaint_type?.replace(/_/g, " ")}
                    </span>
                    <p className="complaint-card__total">₱{Number(c.total).toFixed(2)}</p>
                  </div>
                </div>
                {c.complaint_note && (
                  <p className="complaint-card__note">"{c.complaint_note}"</p>
                )}
                <div className="complaint-card__actions">
                  <p className="complaint-card__instruction">
                    Call {c.consumer_name} at {c.consumer_phone} to resolve this complaint.
                    Once resolved, mark it below.
                  </p>
                  <button
                    type="button"
                    className="complaint-card__resolve"
                    disabled={actionBusy === c.id}
                    onClick={() => handleResolve(c.id)}
                  >
                    {actionBusy === c.id ? "Resolving…" : "Mark as Resolved"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="deliveries-filter">
        {["all", "assigned", "out_for_delivery", "delivered", "complaint"].map((f) => (
          <button key={f} type="button"
            className={`deliveries-filter__btn ${filter === f ? "deliveries-filter__btn--active" : ""}`}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Deliveries list */}
      {loading ? (
        <div className="deliveries-empty">Loading deliveries…</div>
      ) : filtered.length === 0 ? (
        <div className="deliveries-empty">No deliveries found.</div>
      ) : (
        <div className="deliveries-list">
          {filtered.map((d) => (
            <div key={d.id} className={`delivery-card delivery-card--${d.status}`}>
              <div className="delivery-card__header">
                <div>
                  <p className="delivery-card__id">Delivery #{d.id} · Order #{d.order_id}</p>
                  <p className="delivery-card__consumer">{d.consumer_name} · {d.consumer_phone}</p>
                  <p className="delivery-card__address">📍 {d.consumer_address}</p>
                  <p className="delivery-card__staff">Staff: {d.staff_name}</p>
                  {d.sms_sent_at && (
                    <p className="delivery-card__sms">
                      SMS sent at {new Date(d.sms_sent_at).toLocaleTimeString("en-PH")}
                    </p>
                  )}
                </div>
                <div className="delivery-card__right">
                  <span className={`delivery-card__status delivery-card__status--${d.status}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                  <p className="delivery-card__total">₱{Number(d.total).toFixed(2)}</p>
                </div>
              </div>

              {d.status === "assigned" && (
                <div className="delivery-card__actions">
                  <button
                    type="button"
                    className="delivery-card__dispatch"
                    disabled={actionBusy === d.id}
                    onClick={() => handleDispatch(d.id)}
                  >
                    {actionBusy === d.id ? "Dispatching…" : "Mark Out for Delivery + Send SMS"}
                  </button>
                </div>
              )}

              {d.has_complaint && !d.complaint_resolved && (
                <div className="delivery-card__complaint-flag">
                  ⚠ Complaint: {d.complaint_type?.replace(/_/g, " ")}
                  {d.complaint_note && ` — "${d.complaint_note}"`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDeliveries;
