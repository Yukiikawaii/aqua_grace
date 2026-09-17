import { useState, useEffect, type FormEvent } from "react";
import { listOrders, placeOrder, cancelOrder, listStocks, ApiError } from "../../../lib/api";
import "./AdminOrders.css";

interface StockItem { product_id: string; label: string; size: string; price: number; quantity: number; }
interface OrderItem { product_id: string; label: string; size: string; quantity: number; price: number; }
interface Order {
  id: number; order_type: string; consumer_name: string; consumer_phone: string;
  consumer_address: string | null; status: string; total: number; placed_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [orderType, setOrderType] = useState<"walk_in" | "call">("walk_in");
  const [consumerName, setConsumerName] = useState("");
  const [consumerPhone, setConsumerPhone] = useState("");
  const [consumerAddress, setConsumerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [filter, setFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, stocksData] = await Promise.all([
        listOrders() as Promise<{ orders: Order[] }>,
        listStocks() as Promise<{ stocks: StockItem[] }>,
      ]);
      setOrders(ordersData.orders ?? []);
      setStocks(stocksData.stocks ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const addItem = (stock: StockItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === stock.product_id);
      if (existing) {
        return prev.map((i) => i.product_id === stock.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: stock.product_id, label: stock.label, size: stock.size, price: stock.price, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const resetForm = () => {
    setOrderType("walk_in"); setConsumerName(""); setConsumerPhone("");
    setConsumerAddress(""); setNotes(""); setItems([]);
    setFormError(null); setFormSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null); setFormSuccess(null);
    if (!consumerName.trim() || !consumerPhone.trim()) {
      setFormError("Consumer name and phone are required."); return;
    }
    if (orderType === "call" && !consumerAddress.trim()) {
      setFormError("Delivery address is required for call orders."); return;
    }
    if (items.length === 0) { setFormError("Add at least one item."); return; }

    setFormBusy(true);
    try {
      const result = await placeOrder({
        orderType, consumerName: consumerName.trim(),
        consumerPhone: consumerPhone.trim(),
        consumerAddress: consumerAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
        adminId: 1,
      }) as { orderId: number; assignedStaff?: { fullName: string } };

      setFormSuccess(
        orderType === "walk_in"
          ? `Walk-in order #${result.orderId} recorded.`
          : `Call order #${result.orderId} assigned to ${result.assignedStaff?.fullName ?? "staff"}.`
      );
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setFormBusy(false); }
  };

  const handleCancel = async (id: number) => {
    try { await cancelOrder(id); await loadData(); } catch { /* silent */ }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <div>
          <h1 className="admin-orders__title">Orders</h1>
          <p className="admin-orders__sub">Manually record walk-in and call orders.</p>
        </div>
        <button type="button" className="admin-orders__new-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {/* Order form */}
      {showForm && (
        <div className="order-form-card">
          <h2 className="order-form-card__title">New Order</h2>
          <form onSubmit={handleSubmit} noValidate className="order-form">

            {/* Order type toggle */}
            <div className="order-form__type-toggle">
              <button type="button"
                className={`order-form__type-btn ${orderType === "walk_in" ? "order-form__type-btn--active" : ""}`}
                onClick={() => setOrderType("walk_in")}>Walk-In</button>
              <button type="button"
                className={`order-form__type-btn ${orderType === "call" ? "order-form__type-btn--active" : ""}`}
                onClick={() => setOrderType("call")}>Call / SMS</button>
            </div>

            <div className="order-form__grid">
              <div className="order-form__field">
                <label>Consumer Name</label>
                <input type="text" value={consumerName} onChange={(e) => setConsumerName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="order-form__field">
                <label>Phone Number</label>
                <input type="tel" value={consumerPhone} onChange={(e) => setConsumerPhone(e.target.value)} placeholder="09xx-xxx-xxxx" />
              </div>
              {orderType === "call" && (
                <div className="order-form__field order-form__field--full">
                  <label>Delivery Address</label>
                  <input type="text" value={consumerAddress} onChange={(e) => setConsumerAddress(e.target.value)} placeholder="Full delivery address" />
                </div>
              )}
              <div className="order-form__field order-form__field--full">
                <label>Notes (optional)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions…" />
              </div>
            </div>

            {/* Product selector */}
            <div className="order-form__products">
              <p className="order-form__products-label">Add Items</p>
              <div className="order-form__products-grid">
                {stocks.map((s) => (
                  <button key={s.product_id} type="button"
                    className="order-form__product-btn"
                    onClick={() => addItem(s)}
                    disabled={s.quantity === 0}>
                    <span className="order-form__product-label">{s.label}</span>
                    <span className="order-form__product-size">{s.size}</span>
                    <span className="order-form__product-price">₱{s.price}</span>
                    {s.quantity === 0 && <span className="order-form__product-out">Out</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="order-form__items">
                {items.map((item) => (
                  <div key={item.product_id} className="order-form__item">
                    <span className="order-form__item-name">{item.label} ({item.size})</span>
                    <div className="order-form__item-qty">
                      <button type="button" onClick={() => updateItemQty(item.product_id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateItemQty(item.product_id, item.quantity + 1)}>+</button>
                    </div>
                    <span className="order-form__item-sub">₱{(item.price * item.quantity).toFixed(2)}</span>
                    <button type="button" className="order-form__item-remove" onClick={() => removeItem(item.product_id)}>✕</button>
                  </div>
                ))}
                <div className="order-form__total">Total: <strong>₱{total.toFixed(2)}</strong></div>
              </div>
            )}

            {formError && <p className="order-form__error" role="alert">{formError}</p>}
            {formSuccess && <p className="order-form__success" role="status">{formSuccess}</p>}

            <button type="submit" className="order-form__submit" disabled={formBusy}>
              {formBusy ? "Processing…" : orderType === "walk_in" ? "Record Walk-In" : "Place Call Order"}
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="orders-filter">
        {["all", "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"].map((f) => (
          <button key={f} type="button"
            className={`orders-filter__btn ${filter === f ? "orders-filter__btn--active" : ""}`}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="orders-empty">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="orders-empty">No orders found.</div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            <div key={order.id} className={`order-card order-card--${order.status}`}>
              <div className="order-card__header">
                <div>
                  <p className="order-card__id">Order #{order.id}</p>
                  <p className="order-card__consumer">{order.consumer_name} · {order.consumer_phone}</p>
                  {order.consumer_address && <p className="order-card__address">📍 {order.consumer_address}</p>}
                  <p className="order-card__date">{new Date(order.placed_at).toLocaleString("en-PH")}</p>
                </div>
                <div className="order-card__right">
                  <span className={`order-card__type order-card__type--${order.order_type}`}>
                    {order.order_type === "walk_in" ? "Walk-In" : "Call / SMS"}
                  </span>
                  <span className={`order-card__status order-card__status--${order.status}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  <p className="order-card__total">₱{Number(order.total).toFixed(2)}</p>
                </div>
              </div>
              {order.status === "pending" && (
                <div className="order-card__actions">
                  <button type="button" className="order-card__cancel" onClick={() => handleCancel(order.id)}>
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
