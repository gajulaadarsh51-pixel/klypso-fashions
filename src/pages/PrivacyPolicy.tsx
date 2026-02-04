import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-xl font-serif font-semibold text-primary">
              SS FASHIONS
            </h1>
            <p className="text-xs text-muted-foreground">
              Elegant Styles for Every Occasion
            </p>
          </div>

          <Link
            to="/"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-white text-center py-16">
        <h2 className="text-4xl font-serif mb-3">Privacy Policy</h2>
        <p className="max-w-xl mx-auto opacity-90">
          Learn how SS Fashions collects, uses, and protects your personal data.
        </p>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            1. Introduction & Scope
          </h3>
          <p>
            SS Fashions is committed to protecting your privacy. This policy
            explains how we collect, use, and safeguard your personal
            information across our website and services.
          </p>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            2. Information We Collect
          </h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Personal details (name, email, phone)</li>
            <li>Order and payment information</li>
            <li>Browsing behavior and cookies</li>
          </ul>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            3. How We Use Your Information
          </h3>
          <p>
            We use your data to process orders, provide customer support,
            improve our services, and send important updates.
          </p>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            4. Contact Information
          </h3>
          <p>Email: support@ssfashions.com</p>
          <p>Phone: +91 90000 00000</p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
