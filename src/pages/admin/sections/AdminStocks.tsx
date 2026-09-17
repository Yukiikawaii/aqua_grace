import { useState, useEffect } from "react";
import { listStocks, adjustStock, updateThreshold, ApiError } from "../../../lib/api";
import "./AdminStocks.css";

interface StockItem {
  product_id: string;
  label: string;
  size: string;
  price: number;
  quantity: number;
  threshold: number;
}

function getStatus(quantity: number, threshold: number): "sufficient" | "low" | "out" {
  if (quantity === 0) return "out";
  if (quantity <= threshold) return "low";
  return "sufficient";
}

const STATUS_LABEL = { sufficient: "Sufficient", low: "Low Stock", out: "Out of Stock" };
const ADMIN_ID = 1;

function AdminStocks() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [thresholdEdit, setThresholdEdit] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await listStocks() as { stocks: StockItem[] };
      setStocks((data.stocks ?? []).map((s) => ({
        ...s,
        price: Number(s.price),
        quantity: Number(s.quantity),
        threshold: Number(s.threshold),
      })));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStocks(); }, []);

  const handleAdjust = async (productId: string) => {
    const val = parseInt(adjustValue);
    if (isNaN(val) || val <= 0) { setError("Enter a valid quantity."); return; }
    setBusy(true);
    setError(null);
    try {
      await adjustStock({ productId, type: adjustType, quantity: val, adminId: ADMIN_ID });
      setMessage(`Stock ${adjustType === "add" ? "added" : "removed"} successfully.`);
      setAdjustId(null);
      setAdjustValue("");
      await loadStocks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  const handleThresholdSave = async (productId: string) => {
    const val = parseInt(thresholdValue);
    if (isNaN(val) || val < 0) { setError("Enter a valid threshold."); return; }
    setBusy(true);
    setError(null);
    try {
      await updateThreshold({ productId, threshold: val });
      setMessage("Threshold updated.");
      setThresholdEdit(null);
      setThresholdValue("");
      await loadStocks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <div className="admin-stocks">
      <div className="admin-stocks__header">
        <h1 className="admin-stocks__title">Stocks</h1>
        <p className="admin-stocks__sub">Manage water container inventory levels.</p>
      </div>

      {message && (
        <div className="admin-stocks__message" role="status">
          {message}
          <button type="button" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}
      {error && (
        <div className="admin-stocks__error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="stocks-loading">Loading stocks…</div>
      ) : (
        <div className="stocks-grid">
          {stocks.map((item) => {
            const status = getStatus(item.quantity, item.threshold);
            return (
              <div key={item.product_id} className={`stock-card stock-card--${status}`}>
                <div className="stock-card__top">
                  <div>
                    <p className="stock-card__label">{item.label}</p>
                    <p className="stock-card__size">{item.size} · ₱{item.price.toFixed(2)}</p>
                  </div>
                  <span className={`stock-card__status stock-card__status--${status}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                <p className="stock-card__quantity">{item.quantity}</p>
                <p className="stock-card__quantity-label">units in stock</p>

                {/* Threshold */}
                <div className="stock-card__threshold">
                  {thresholdEdit === item.product_id ? (
                    <div className="stock-card__threshold-edit">
                      <input
                        type="number" min="0" value={thresholdValue}
                        onChange={(e) => setThresholdValue(e.target.value)}
                        placeholder="Threshold"
                      />
                      <button type="button" disabled={busy} onClick={() => handleThresholdSave(item.product_id)}>
                        {busy ? "…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setThresholdEdit(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button type="button" className="stock-card__threshold-btn"
                      onClick={() => { setThresholdEdit(item.product_id); setThresholdValue(String(item.threshold)); }}>
                      Alert threshold: {item.threshold} units
                    </button>
                  )}
                </div>

                {/* Adjust */}
                {adjustId === item.product_id ? (
                  <div className="stock-card__adjust">
                    <div className="stock-card__adjust-toggle">
                      <button type="button" className={adjustType === "add" ? "active" : ""}
                        onClick={() => setAdjustType("add")}>Add</button>
                      <button type="button" className={adjustType === "subtract" ? "active" : ""}
                        onClick={() => setAdjustType("subtract")}>Remove</button>
                    </div>
                    <input type="number" min="1" value={adjustValue}
                      onChange={(e) => setAdjustValue(e.target.value)} placeholder="Quantity" />
                    <div className="stock-card__adjust-actions">
                      <button type="button" className="stock-card__btn stock-card__btn--primary"
                        disabled={busy} onClick={() => handleAdjust(item.product_id)}>
                        {busy ? "…" : "Confirm"}
                      </button>
                      <button type="button" className="stock-card__btn"
                        onClick={() => { setAdjustId(null); setAdjustValue(""); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="stock-card__btn stock-card__btn--primary"
                    onClick={() => { setAdjustId(item.product_id); setAdjustType("add"); }}>
                    Adjust Stock
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminStocks;
