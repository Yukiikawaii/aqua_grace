import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { getPublicStocks } from "../lib/api";

import aquaGraceLogo from "../assets/images/aqua-grace-logo.jpg";

import heroBackground from "../assets/images/hero-background.jpg";

import "./LandingPage.css";

interface StockItem {
  product_id: string;
  label: string;
  size: string;
  price: number;
  quantity: number;
  threshold: number;
}

function getStockStatus(
  quantity: number,
  threshold: number
): "sufficient" | "low" | "out" {
  if (quantity === 0) return "out";
  if (quantity <= threshold) return "low";
  return "sufficient";
}

const STATUS_LABEL = {
  sufficient: "Available",
  low: "Low Stock",
  out: "Out of Stock",
};

function LandingPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // Stocks
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);

  useEffect(() => {
    async function loadStocks() {
      try {
        const data = (await getPublicStocks()) as {
          stocks: StockItem[];
        };

        setStocks(data.stocks ?? []);
      } catch {
        // silently fail — landing page still works without stock data
      } finally {
        setStocksLoading(false);
      }
    }

    loadStocks();
  }, []);

  return (
    <div className="landing">
      {/* ── NAVBAR ── */}
      <nav className="landing-navbar">
        <div className="landing-navbar__brand">
          <img
            src={aquaGraceLogo}
            alt="Aqua Grace"
            className="landing-navbar__logo"
          />

          <p>Aqua Grace</p>
        </div>

        <button
          className="landing-navbar__burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <div
          className={`landing-navbar__links ${
            menuOpen ? "landing-navbar__links--open" : ""
          }`}
        >
          <a href="#home" onClick={() => setMenuOpen(false)}>
            Home
          </a>

          <a href="#about" onClick={() => setMenuOpen(false)}>
            About Us
          </a>

          <a href="#products" onClick={() => setMenuOpen(false)}>
            Products
          </a>

          <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>

          <button
            type="button"
            className="landing-navbar__admin"
            onClick={() => {
              setMenuOpen(false);
              navigate("/admin/login");
            }}
          >
            Admin Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero" id="home">
        <div
          className="landing-hero__bg"
          style={{ backgroundImage: `url(${heroBackground})` }}
          aria-hidden="true"
        />

        <div className="landing-hero__scrim" aria-hidden="true" />

        <div className="landing-hero__inner container">
          {/* Center — branding */}
          <div className="landing-hero__brand">
            <h1 className="landing-hero__title">
              <span>PURE WATER</span>
              <span>FOR EVERY DAY</span>
            </h1>

            <p className="landing-hero__desc">
              Clean, refreshing purified water — available for walk-in refills
              and phone/SMS delivery orders in Koronadal City.
            </p>

            <div className="landing-hero__ctas">
              <a
                href="#products"
                className="landing-hero__cta-primary"
              >
                View Products
              </a>

              <a
                href="#how-to-order"
                className="landing-hero__cta-secondary"
              >
                How to Order
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="landing-hero__scroll" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section
        className="landing-section landing-about"
        id="about"
      >
        <div className="container">
          <div className="landing-section__eyebrow">
            About Us
          </div>

          <h2 className="landing-section__heading">
            A Trusted Name in Clean Water
          </h2>

          <div className="landing-about__grid">
            <div className="landing-about__text">
              <p>
                Aqua Grace Water Refilling Station has been serving
                Koronadal City since 2022, providing purified drinking
                water to households and businesses. Located at Purok
                Bliss, Brgy. Paraiso, we offer walk-in refills and
                delivery services across the city.
              </p>

              <p>
                Our water undergoes a thorough purification process to
                ensure it is safe, clean, and refreshing for your
                everyday needs. We are committed to reliability,
                affordability, and care.
              </p>
            </div>

            <div className="landing-about__stats">
              <div className="about-stat">
                <span className="about-stat__value">2022</span>
                <span className="about-stat__label">Est.</span>
              </div>

              <div className="about-stat">
                <span className="about-stat__value">7</span>
                <span className="about-stat__label">Staff</span>
              </div>

              <div className="about-stat">
                <span className="about-stat__value">4</span>
                <span className="about-stat__label">Sizes</span>
              </div>

              <div className="about-stat">
                <span className="about-stat__value">COD</span>
                <span className="about-stat__label">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section
        className="landing-section landing-products"
        id="products"
      >
        <div className="container">
          <div className="landing-section__eyebrow">
            Products
          </div>

          <h2 className="landing-section__heading">
            Available Container Sizes
          </h2>

          <p className="landing-section__sub">
            Stock levels are updated in real time.
          </p>

          {stocksLoading ? (
            <div className="products-loading">
              <div className="products-loading__spinner" />
              <p>Loading stock information…</p>
            </div>
          ) : (
            <div className="products-grid">
              {stocks.map((item) => {
                const status = getStockStatus(
                  Number(item.quantity),
                  Number(item.threshold)
                );

                return (
                  <div
                    key={item.product_id}
                    className={`product-card product-card--${status}`}
                  >
                    <div className="product-card__top">
                      <div className="product-card__icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3.5c3.2 4 6 7.3 6 10.7a6 6 0 1 1-12 0c0-3.4 2.8-6.7 6-10.7Z" />
                        </svg>
                      </div>

                      <span
                        className={`product-card__badge product-card__badge--${status}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>

                    <h3 className="product-card__label">
                      {item.label}
                    </h3>

                    <p className="product-card__size">
                      {item.size}
                    </p>

                    <p className="product-card__price">
                      ₱{Number(item.price).toFixed(2)}
                    </p>

                    <div className="product-card__stock">
                      <div
                        className="product-card__stock-bar"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(item.quantity) /
                              Math.max(
                                Number(item.threshold) * 3,
                                1
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="product-card__stock-label">
                      {Number(item.quantity)} units available
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW TO ORDER ── */}
      <section
        className="landing-section landing-how"
        id="how-to-order"
      >
        <div className="container">
          <div className="landing-section__eyebrow">
            How to Order
          </div>

          <h2 className="landing-section__heading">
            Two Ways to Get Your Water
          </h2>

          <div className="landing-how__grid">
            <div className="how-card">
              <div className="how-card__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                  />
                </svg>
              </div>

              <h3 className="how-card__title">Walk-In</h3>

              <p className="how-card__desc">
                Visit us at Purok Bliss, Brgy. Paraiso, Koronadal
                City. Bring your container and our staff will refill
                it on the spot. Payment is made in cash at the
                counter.
              </p>

              <ul className="how-card__steps">
                <li>Bring your container</li>
                <li>Tell us the size you need</li>
                <li>Pay in cash</li>
                <li>Take your water home</li>
              </ul>
            </div>

            <div className="how-card how-card--accent">
              <div className="how-card__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
                </svg>
              </div>

              <h3 className="how-card__title">
                Call or SMS
              </h3>

              <p className="how-card__desc">
                Order by phone or SMS and we will deliver to your
                door. Cash on delivery — pay when your order
                arrives.
              </p>

              <ul className="how-card__steps">
                <li>Call or SMS our number</li>
                <li>Tell us your address and order</li>
                <li>We assign a delivery staff</li>
                <li>Pay cash upon delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section
        className="landing-section landing-contact"
        id="contact"
      >
        <div className="container">
          <div className="landing-section__eyebrow">
            Contact
          </div>

          <h2 className="landing-section__heading">
            Get in Touch
          </h2>

          <div className="landing-contact__grid">
            <div className="contact-item">
              <div className="contact-item__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <div>
                <p className="contact-item__label">Location</p>
                <p className="contact-item__value">
                  Purok Bliss, Brgy. Paraiso
                </p>
                <p className="contact-item__value">
                  Koronadal City, South Cotabato
                </p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
                </svg>
              </div>

              <div>
                <p className="contact-item__label">
                  Phone / SMS
                </p>
                <p className="contact-item__value">
                  09534926037
                </p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <div>
                <p className="contact-item__label">
                  Business Hours
                </p>
                <p className="contact-item__value">
                  Monday – Saturday
                </p>
                <p className="contact-item__value">
                  7:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container">
          <p>
            © {new Date().getFullYear()} Aqua Grace Water Refilling
            Station. Koronadal City, South Cotabato.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;