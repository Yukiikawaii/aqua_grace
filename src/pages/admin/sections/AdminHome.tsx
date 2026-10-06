import { useState, useEffect } from "react";

import {
  getDashboardOverview,
  getSalesSummary,
} from "../../../lib/api";

import "./AdminHome.css";

interface StockItem {
  product_id: string;
  label: string;
  quantity: number;
  threshold: number;
}

interface StaffStat {
  staff_id: number;
  staff_name: string;
  total_deliveries: number;
  week_deliveries: number;
}

interface Complaint {
  id: number;
  order_id: number;
  consumer_name: string;
  complaint_type: string;
}

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

interface SalesSummaryItem {
  id: string;
  label: string;
  size: string;
  price: number;
  total_units: number;
  total_revenue: number;
}

const WEEK_GOAL = 30;

function MiniWheel({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const size = 56;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference * (1 - Math.min(value / max, 1));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e4e9f2"
        strokeWidth="6"
      />

      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 0.6s ease",
        }}
      />

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="700"
        fill="#0f2340"
        fontFamily="Sora,system-ui,sans-serif"
      >
        {value}
      </text>
    </svg>
  );
}

function SalesPieChart({
  items,
}: {
  items: SalesSummaryItem[];
}) {
  const colors = [
    "#2489da",
    "#43a047",
    "#f5a623",
    "#e85d75",
  ];

  const salesItems = items.filter(
    (item) => item.total_revenue > 0
  );

  const total = salesItems.reduce(
    (sum, item) => sum + item.total_revenue,
    0
  );

  if (total === 0) {
    return (
      <div className="sales-pie-empty">
        No sales recorded today.
      </div>
    );
  }

  let currentPercentage = 0;

  const segments = salesItems.map((item, index) => {
    const percentage =
      (item.total_revenue / total) * 100;

    const start = currentPercentage;

    currentPercentage += percentage;

    return {
      ...item,
      percentage,
      start,
      end: currentPercentage,
      color: colors[index % colors.length],
    };
  });

  const gradient = segments
    .map(
      (item) =>
        `${item.color} ${item.start}% ${item.end}%`
    )
    .join(", ");

  return (
    <div className="sales-pie">
      <div className="sales-pie__chart-wrapper">
        <div
          className="sales-pie__chart"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        >
          <div className="sales-pie__center">
            <span>Total Sales</span>

            <strong>
              ₱{total.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      <div className="sales-pie__legend">
        {segments.map((item) => (
          <div
            key={item.id}
            className="sales-pie__legend-item"
          >
            <span
              className="sales-pie__dot"
              style={{
                backgroundColor: item.color,
              }}
            />

            <div className="sales-pie__legend-info">
              <span>
                {item.label} ({item.size})
              </span>

              <strong>
                ₱{item.total_revenue.toFixed(2)}
              </strong>
            </div>

            <span className="sales-pie__percentage">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminHome() {
  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [salesSummary, setSalesSummary] =
    useState<SalesSummaryItem[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const [dashboardData, summaryData] =
          await Promise.all([
            getDashboardOverview(),
            getSalesSummary(
              getTodayDate(),
              getTodayDate()
            ),
          ]);

        if (isMounted) {
          setOverview(
            dashboardData as Overview
          );

          const summary =
            (
              summaryData as {
                summary: SalesSummaryItem[];
              }
            ).summary ?? [];

          setSalesSummary(
            summary.map((item) => ({
              ...item,
              price: Number(item.price),
              total_units: Number(
                item.total_units
              ),
              total_revenue: Number(
                item.total_revenue
              ),
            }))
          );
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard overview:",
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    const interval = setInterval(() => {
      loadOverview();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const dateString =
    new Date().toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="admin-home">
      <div className="admin-home__header">
        <div>
          <h1 className="admin-home__title">
            Dashboard
          </h1>

          <p className="admin-home__date">
            {dateString}
          </p>
        </div>

        <span className="admin-home__badge">
          Master Admin
        </span>
      </div>

      {loading ? (
        <div className="admin-home__loading">
          Loading overview…
        </div>
      ) : overview ? (
        <>
          {overview.unresolvedComplaints > 0 && (
            <div className="admin-home__complaint-alert">
              <span className="admin-home__complaint-icon">
                ⚠
              </span>

              <div>
                <strong>
                  {overview.unresolvedComplaints}{" "}
                  unresolved complaint
                  {overview.unresolvedComplaints > 1
                    ? "s"
                    : ""}
                </strong>

                <p>
                  Go to Deliveries to review and
                  resolve.
                </p>
              </div>
            </div>
          )}

          <div className="admin-home__stats">
            <div className="stat-card stat-card--blue">
              <p className="stat-card__label">
                Orders Today
              </p>

              <p className="stat-card__value">
                {overview.ordersToday}
              </p>
            </div>

            <div className="stat-card stat-card--yellow">
              <p className="stat-card__label">
                Pending Deliveries
              </p>

              <p className="stat-card__value">
                {overview.pendingDeliveries}
              </p>
            </div>

            <div className="stat-card stat-card--red">
              <p className="stat-card__label">
                Low Stock Alerts
              </p>

              <p className="stat-card__value">
                {overview.lowStockCount}
              </p>
            </div>

            <div className="stat-card stat-card--green">
              <p className="stat-card__label">
                Sales Today
              </p>

              <p className="stat-card__value">
                ₱
                {Number(
                  overview.salesToday
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="admin-home__section">
            <h2 className="admin-home__section-title">
              Sales by Container Size
            </h2>

            <div className="sales-pie-card">
              <SalesPieChart
                items={salesSummary}
              />
            </div>
          </div>

          {overview.lowStockItems.length > 0 && (
            <div className="admin-home__section">
              <h2 className="admin-home__section-title">
                Low Stock Items
              </h2>

              <div className="admin-home__low-stock">
                {overview.lowStockItems.map(
                  (item) => (
                    <div
                      key={item.product_id}
                      className="low-stock-item"
                    >
                      <span className="low-stock-item__label">
                        {item.label}
                      </span>

                      <span
                        className={`low-stock-item__qty ${
                          item.quantity === 0
                            ? "low-stock-item__qty--out"
                            : "low-stock-item__qty--low"
                        }`}
                      >
                        {item.quantity === 0
                          ? "Out of Stock"
                          : `${item.quantity} units`}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {overview.staffStats.length > 0 && (
            <div className="admin-home__section">
              <h2 className="admin-home__section-title">
                Staff Progress This Week
              </h2>

              <div className="admin-home__staff-wheels">
                {overview.staffStats.map(
                  (staff) => (
                    <div
                      key={staff.staff_id}
                      className="staff-wheel-card"
                    >
                      <MiniWheel
                        value={
                          staff.week_deliveries
                        }
                        max={WEEK_GOAL}
                        color="#2489da"
                      />

                      <p className="staff-wheel-card__name">
                        {staff.staff_name.split(
                          " "
                        )[0]}
                      </p>

                      <p className="staff-wheel-card__total">
                        {staff.total_deliveries}{" "}
                        total
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="admin-home__loading">
          Could not load overview.
        </div>
      )}
    </div>
  );
}

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default AdminHome;