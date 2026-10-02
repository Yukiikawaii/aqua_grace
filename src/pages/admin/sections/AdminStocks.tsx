import { useEffect, useState } from "react";
import {
  listStocks,
  adjustStock,
  updateThreshold,
  ApiError,
} from "../../../lib/api";

import "./AdminStocks.css";

interface StockItem {
  product_id: string;
  label: string;
  size: string;
  price: number;
  quantity: number;
  threshold: number;
}

interface StocksResponse {
  stocks: StockItem[];
}

const STATUS_LABEL = {
  sufficient: "Sufficient",
  low: "Low Stock",
  out: "Out of Stock",
} as const;

// Temporary admin ID.
// Later, get this from the logged-in admin session/authentication.
const ADMIN_ID = 1;

function getStatus(
  quantity: number,
  threshold: number
): "sufficient" | "low" | "out" {
  if (quantity === 0) {
    return "out";
  }

  if (quantity <= threshold) {
    return "low";
  }

  return "sufficient";
}

function AdminStocks() {
  const [stocks, setStocks] = useState<StockItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

  const [thresholdEdit, setThresholdEdit] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // LOAD STOCKS
  // =========================

  const loadStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = (await listStocks()) as StocksResponse;

      const formattedStocks = (data.stocks ?? []).map((stock) => ({
        ...stock,
        product_id: String(stock.product_id),
        price: Number(stock.price),
        quantity: Number(stock.quantity),
        threshold: Number(stock.threshold),
      }));

      setStocks(formattedStocks);
    } catch (err) {
      console.error("LOAD STOCKS ERROR:", err);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load stocks.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  // =========================
  // ADJUST STOCK
  // =========================

  const handleAdjust = async (productId: string) => {
    const quantity = Number(adjustValue);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Enter a valid whole-number quantity greater than 0.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      console.log("ADJUST STOCK:", {
        productId,
        type: adjustType,
        quantity,
        adminId: ADMIN_ID,
      });

      await adjustStock({
        productId,
        type: adjustType,
        quantity,
        adminId: ADMIN_ID,
      });

      setMessage(
        `Stock ${
          adjustType === "add" ? "added" : "removed"
        } successfully.`
      );

      // Reset adjustment form
      setAdjustId(null);
      setAdjustValue("");
      setAdjustType("add");

      // Reload latest stock values
      await loadStocks();
    } catch (err) {
      console.error("ADJUST STOCK ERROR:", err);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while adjusting stock.");
      }
    } finally {
      setBusy(false);
    }
  };

  // =========================
  // UPDATE THRESHOLD
  // =========================

  const handleThresholdSave = async (productId: string) => {
    const threshold = Number(thresholdValue);

    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Enter a valid whole-number threshold.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await updateThreshold({
        productId,
        threshold,
      });

      setMessage("Threshold updated successfully.");

      setThresholdEdit(null);
      setThresholdValue("");

      await loadStocks();
    } catch (err) {
      console.error("UPDATE THRESHOLD ERROR:", err);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while updating the threshold.");
      }
    } finally {
      setBusy(false);
    }
  };

  // =========================
  // OPEN ADJUST FORM
  // =========================

  const openAdjustForm = (productId: string) => {
    setAdjustId(productId);
    setAdjustValue("");
    setAdjustType("add");

    setError(null);
    setMessage(null);

    // Close threshold editor
    setThresholdEdit(null);
  };

  // =========================
  // CLOSE ADJUST FORM
  // =========================

  const closeAdjustForm = () => {
    setAdjustId(null);
    setAdjustValue("");
    setAdjustType("add");
  };

  // =========================
  // OPEN THRESHOLD EDITOR
  // =========================

  const openThresholdEditor = (item: StockItem) => {
    setThresholdEdit(item.product_id);
    setThresholdValue(String(item.threshold));

    setError(null);
    setMessage(null);

    // Close adjustment form
    setAdjustId(null);
    setAdjustValue("");
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="admin-stocks">
      {/* HEADER */}

      <div className="admin-stocks__header">
        <h1 className="admin-stocks__title">Stocks</h1>

        <p className="admin-stocks__sub">
          Manage water container inventory levels.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="admin-stocks__message" role="status">
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Close message"
          >
            ✕
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="admin-stocks__error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ✕
          </button>
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="stocks-loading">Loading stocks...</div>
      ) : stocks.length === 0 ? (
        <div className="stocks-empty">
          <p>No stock records found.</p>

          <button type="button" onClick={loadStocks}>
            Reload
          </button>
        </div>
      ) : (
        /* STOCK GRID */

        <div className="stocks-grid">
          {stocks.map((item) => {
            const status = getStatus(item.quantity, item.threshold);

            return (
              <div
                key={item.product_id}
                className={`stock-card stock-card--${status}`}
              >
                {/* CARD TOP */}

                <div className="stock-card__top">
                  <div>
                    <p className="stock-card__label">{item.label}</p>

                    <p className="stock-card__size">
                      {item.size} · ₱{item.price.toFixed(2)}
                    </p>
                  </div>

                  <span
                    className={`stock-card__status stock-card__status--${status}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {/* QUANTITY */}

                <p className="stock-card__quantity">
                  {item.quantity}
                </p>

                <p className="stock-card__quantity-label">
                  units in stock
                </p>

                {/* THRESHOLD */}

                <div className="stock-card__threshold">
                  {thresholdEdit === item.product_id ? (
                    <div className="stock-card__threshold-edit">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={thresholdValue}
                        onChange={(event) =>
                          setThresholdValue(event.target.value)
                        }
                        placeholder="Threshold"
                        disabled={busy}
                      />

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          handleThresholdSave(item.product_id)
                        }
                      >
                        {busy ? "..." : "Save"}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setThresholdEdit(null);
                          setThresholdValue("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="stock-card__threshold-btn"
                      onClick={() => openThresholdEditor(item)}
                      disabled={busy}
                    >
                      Alert threshold: {item.threshold} units
                    </button>
                  )}
                </div>

                {/* STOCK ADJUSTMENT */}

                {adjustId === item.product_id ? (
                  <div className="stock-card__adjust">
                    {/* ADD / REMOVE */}

                    <div className="stock-card__adjust-toggle">
                      <button
                        type="button"
                        className={
                          adjustType === "add" ? "active" : ""
                        }
                        onClick={() => setAdjustType("add")}
                        disabled={busy}
                      >
                        Add
                      </button>

                      <button
                        type="button"
                        className={
                          adjustType === "subtract" ? "active" : ""
                        }
                        onClick={() => setAdjustType("subtract")}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </div>

                    {/* QUANTITY INPUT */}

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={adjustValue}
                      onChange={(event) =>
                        setAdjustValue(event.target.value)
                      }
                      placeholder="Quantity"
                      disabled={busy}
                    />

                    {/* ACTION BUTTONS */}

                    <div className="stock-card__adjust-actions">
                      <button
                        type="button"
                        className="stock-card__btn stock-card__btn--primary"
                        disabled={busy}
                        onClick={() =>
                          handleAdjust(item.product_id)
                        }
                      >
                        {busy ? "..." : "Confirm"}
                      </button>

                      <button
                        type="button"
                        className="stock-card__btn"
                        disabled={busy}
                        onClick={closeAdjustForm}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ADJUST STOCK BUTTON */

                  <button
                    type="button"
                    className="stock-card__btn stock-card__btn--primary"
                    disabled={busy}
                    onClick={() => openAdjustForm(item.product_id)}
                  >
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