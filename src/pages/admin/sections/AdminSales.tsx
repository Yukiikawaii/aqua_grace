import { useState, useEffect } from "react";
import { listSales, getSalesSummary } from "../../../lib/api";
import "./AdminSales.css";

interface SaleRecord {
  id: number; order_id: number; consumer_name: string;
  consumer_phone: string; order_type: string;
  total: number; payment_method: string; sale_type: string; paid_at: string;
}

interface SummaryItem {
  id: string; label: string; size: string; price: number;
  total_units: number; total_revenue: number;
}

type DateFilter = "today" | "week" | "month" | "all";

function getDateRange(filter: DateFilter): { from: string; to: string } | null {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (filter === "today") return { from: fmt(today), to: fmt(today) };
  if (filter === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return { from: fmt(start), to: fmt(today) };
  }
  if (filter === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmt(start), to: fmt(today) };
  }
  return null;
}

function AdminSales() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DateFilter>("today");

  const loadData = async (f: DateFilter) => {
    setLoading(true);
    try {
      const range = getDateRange(f);
      const [salesData, summaryData] = await Promise.all([
        range
          ? listSales(range.from, range.to) as Promise<{ sales: SaleRecord[] }>
          : listSales() as Promise<{ sales: SaleRecord[] }>,
        getSalesSummary() as Promise<{ summary: SummaryItem[] }>,
      ]);
      setSales((salesData.sales ?? []).map((s) => ({ ...s, total: Number(s.total) })));
      setSummary((summaryData.summary ?? []).map((s) => ({
        ...s, price: Number(s.price),
        total_units: Number(s.total_units),
        total_revenue: Number(s.total_revenue),
      })));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(filter); }, [filter]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalOrders = sales.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const DATE_FILTER_LABELS: Record<DateFilter, string> = {
    today: "Today", week: "This Week", month: "This Month", all: "All Time",
  };

  return (
    <div className="admin-sales">
      <div className="admin-sales__header">
        <h1 className="admin-sales__title">Sales</h1>
        <p className="admin-sales__sub">Revenue summary and transaction history.</p>
      </div>

      {/* Date filter */}
      <div className="sales-filter">
        {(["today", "week", "month", "all"] as DateFilter[]).map((f) => (
          <button key={f} type="button"
            className={`sales-filter__btn ${filter === f ? "sales-filter__btn--active" : ""}`}
            onClick={() => setFilter(f)}>
            {DATE_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="sales-summary">
        <div className="sales-summary-card">
          <p className="sales-summary-card__label">Total Revenue</p>
          <p className="sales-summary-card__value">₱{totalRevenue.toFixed(2)}</p>
          <p className="sales-summary-card__sub">{DATE_FILTER_LABELS[filter]}</p>
        </div>
        <div className="sales-summary-card">
          <p className="sales-summary-card__label">Orders Completed</p>
          <p className="sales-summary-card__value">{totalOrders}</p>
          <p className="sales-summary-card__sub">{DATE_FILTER_LABELS[filter]}</p>
        </div>
        <div className="sales-summary-card">
          <p className="sales-summary-card__label">Average Order Value</p>
          <p className="sales-summary-card__value">₱{avgOrder.toFixed(2)}</p>
          <p className="sales-summary-card__sub">{DATE_FILTER_LABELS[filter]}</p>
        </div>
      </div>

      {/* Product breakdown */}
      <div className="sales-breakdown">
        <h2 className="sales-breakdown__title">Sales by Container Size</h2>
        <div className="sales-breakdown__grid">
          {summary.map((item) => (
            <div key={item.id} className="breakdown-card">
              <p className="breakdown-card__label">{item.label} ({item.size})</p>
              <p className="breakdown-card__value">{item.total_units} units</p>
              <p className="breakdown-card__revenue">₱{item.total_revenue.toFixed(2)}</p>
              <p className="breakdown-card__price">₱{item.price.toFixed(2)} / unit</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="sales-history">
        <h2 className="sales-history__title">Transaction History</h2>
        {loading ? (
          <div className="sales-empty">Loading sales…</div>
        ) : sales.length === 0 ? (
          <div className="sales-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <p>No sales recorded yet.</p>
          </div>
        ) : (
          <div className="sales-list">
            {sales.map((sale) => (
              <div key={sale.id} className="sale-card">
                <div className="sale-card__header">
                  <div>
                    <p className="sale-card__id">Sale #{sale.id} · Order #{sale.order_id}</p>
                    <p className="sale-card__customer">{sale.consumer_name} · {sale.consumer_phone}</p>
                    <span className={`sale-card__type sale-card__type--${sale.sale_type}`}>
                      {sale.sale_type === "walk_in" ? "Walk-In" : "Delivery"}
                    </span>
                  </div>
                  <div className="sale-card__right">
                    <p className="sale-card__total">₱{sale.total.toFixed(2)}</p>
                    <p className="sale-card__date">{new Date(sale.paid_at).toLocaleString("en-PH")}</p>
                    <span className="sale-card__payment">{sale.payment_method}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSales;
