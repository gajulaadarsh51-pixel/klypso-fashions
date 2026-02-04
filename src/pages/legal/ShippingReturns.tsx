import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  QrCode,
  RefreshCcw,
  Smartphone,
  Ban,
  AlertTriangle,
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ChevronLeft,
} from "lucide-react";

const faqs = [
  {
    q: "How do I track my order?",
    a: "Track via our mobile app, website login, email tracking link, or by contacting customer service with your Order ID.",
  },
  {
    q: "Is the app available for iOS and Android?",
    a: "Yes! Download SS Fashions app from Google Play Store for Android and App Store for iOS devices.",
  },
  {
    q: "Where can I find my Order ID?",
    a: "Find it in 'My Orders' in the app, your order confirmation email, or on your account page.",
  },
  {
    q: "Can I return items via the app?",
    a: "Yes, use the app to initiate returns, generate return labels, and track return status in real-time.",
  },
  {
    q: "Do you offer international shipping?",
    a: "Yes, we ship internationally to selected countries. Shipping rates and times vary by destination.",
  },
];

const ShippingReturns = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* HEADER */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          {/* Back Button for Mobile */}
          <button
            onClick={() => navigate(-1)}
            className="sm:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Title - Clickable for Home */}
          <div 
            className="text-center sm:text-left cursor-pointer"
            onClick={goToHome}
          >
            <h1 className="text-2xl font-serif font-bold text-primary">
              SS FASHIONS
            </h1>
            <p className="text-xs text-muted-foreground">
              Elegant Styles for Every Occasion
            </p>
          </div>

          {/* Spacer for mobile to balance layout */}
          <div className="sm:hidden w-10"></div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-primary text-white text-center py-16 px-4">
        <h2 className="text-3xl sm:text-4xl font-serif mb-3">
          Shipping & Returns
        </h2>
        <p className="max-w-2xl mx-auto opacity-90 text-sm sm:text-base">
          At SS Fashions, we strive to make your shopping experience seamless.
          Learn about shipping, tracking, returns, and mobile app benefits.
        </p>
      </section>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* MAIN */}
        <main className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* APP TRACKING */}
          <section className="bg-gradient-to-br from-primary to-primary/90 text-white p-6 sm:p-8 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="text-gold" />
              <h3 className="text-xl sm:text-2xl font-serif text-gold">
                Track Orders on Our App
              </h3>
            </div>

            <p className="mb-6 opacity-90 text-sm sm:text-base">
              Get real-time updates, push notifications, and manage all your
              orders in one place.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="bg-gold text-primary w-8 h-8 flex items-center justify-center rounded-full font-bold">
                  1
                </span>
                <p>Download the SS Fashions app</p>
              </div>

              <div className="flex gap-3">
                <span className="bg-gold text-primary w-8 h-8 flex items-center justify-center rounded-full font-bold">
                  2
                </span>
                <p>Login or create an account</p>
              </div>

              <div className="flex gap-3">
                <span className="bg-gold text-primary w-8 h-8 flex items-center justify-center rounded-full font-bold">
                  3
                </span>
                <p>Go to "My Orders" for live tracking</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary px-6 py-3 rounded font-semibold hover:bg-muted transition text-center"
              >
                Get it on Google Play
              </a>
              <a
                href="https://apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary px-6 py-3 rounded font-semibold hover:bg-muted transition text-center"
              >
                Download on App Store
              </a>
            </div>
          </section>

          {/* SHIPPING */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="text-gold" />
              <h3 className="text-xl font-semibold">Shipping Policy</h3>
            </div>

            <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
              <li>Standard Shipping: 5-7 business days</li>
              <li>Express Shipping: 2-3 business days</li>
              <li>International Shipping: 10-15 business days</li>
            </ul>

            <div className="mt-4 bg-gold/10 border-l-4 border-gold p-4 rounded">
              <p><strong>Free Shipping</strong> on orders above ₹2000</p>
              <p>Standard: ₹99 | Express: ₹199</p>
            </div>
          </section>

          {/* ORDER ID */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <QrCode className="text-gold" />
              <h3 className="text-xl font-semibold">
                Order ID & Tracking Information
              </h3>
            </div>

            <p className="mb-3">
              Format: <strong>SSF-XXXX-YYYY-MMDD</strong>
            </p>

            <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
              <li>Find in mobile app under "My Orders"</li>
              <li>Check order confirmation email</li>
              <li>View on website account dashboard</li>
            </ul>
          </section>

          {/* RETURNS */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCcw className="text-gold" />
              <h3 className="text-xl font-semibold">Returns & Exchanges</h3>
            </div>

            <p className="text-sm sm:text-base">
              Returns accepted within <strong>30 days</strong> of delivery.
              Items must be unused, unwashed, and in original packaging.
            </p>

            <ul className="list-disc ml-5 mt-3 space-y-1 text-muted-foreground">
              <li>No returns on innerwear & clearance items</li>
              <li>Refunds processed in 5-10 business days</li>
              <li>Size/color exchanges subject to availability</li>
            </ul>
          </section>

          {/* CANCELLATIONS */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <Ban className="text-gold" />
              <h3 className="text-xl font-semibold">Cancellations</h3>
            </div>

            <p className="text-sm sm:text-base">
              Orders can be canceled within <strong>24 hours</strong> before
              shipment. After shipping, returns apply.
            </p>
          </section>

          {/* DAMAGES */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-gold" />
              <h3 className="text-xl font-semibold">
                Damaged or Defective Items
              </h3>
            </div>

            <p className="text-sm sm:text-base">
              Report within <strong>48 hours</strong> with photos for a free
              replacement or refund.
            </p>
          </section>

          {/* SPECIAL NOTES */}
          <section className="bg-background p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-3">
              <Star className="text-gold" />
              <h3 className="text-xl font-semibold">Special Notes</h3>
            </div>

            <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
              <li>Handle delicate fabrics with care</li>
              <li>Bridal/custom wear has different return policies</li>
              <li>Refer to size guide before ordering</li>
            </ul>
          </section>
        </main>

        {/* SIDEBAR */}
        <aside className="bg-background p-6 rounded-lg shadow h-fit sticky top-24 sm:top-28 space-y-6">
          <h3 className="text-xl font-serif text-primary text-center">
            Need Help?
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="text-gold" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">
                  support@ssfashions.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="text-gold" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-sm text-muted-foreground">
                  +91 98765 43210
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* FAQ */}
          <div>
            <h4 className="font-semibold mb-3">Quick FAQs</h4>

            {faqs.map((faq, i) => (
              <div key={i} className="border-b py-2">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-left font-medium text-primary hover:text-gold transition"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? <ChevronUp /> : <ChevronDown />}
                </button>

                {openFaq === i && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="bg-primary text-white py-8 text-center">
        <p className="text-gold font-serif text-lg">
          SS FASHIONS
        </p>
        <p className="text-sm opacity-80 mt-2">
          Elegant Styles for Every Occasion
        </p>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-sm px-4">
          <Link to="/" className="hover:text-gold">Home</Link>
          <Link to="/products" className="hover:text-gold">Shop</Link>
          <Link to="/shipping" className="hover:text-gold">
            Shipping & Returns
          </Link>
          <Link to="/privacy" className="hover:text-gold">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-gold">
            Terms & Conditions
          </Link>
        </div>

        <p className="text-xs opacity-60 mt-4">
          © 2024 SS Fashions. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ShippingReturns;