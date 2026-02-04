import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-xl font-serif font-semibold text-primary">
            SS FASHIONS
          </h1>
          <Link
            to="/"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      <section className="bg-primary text-white text-center py-16">
        <h2 className="text-4xl font-serif mb-3">Terms of Service</h2>
        <p className="max-w-xl mx-auto opacity-90">
          Please read these terms carefully before using our services.
        </p>
      </section>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            1. Acceptance of Terms
          </h3>
          <p>
            By accessing SS Fashions, you agree to follow all rules and policies
            described in this document.
          </p>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            2. Account Responsibilities
          </h3>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials.
          </p>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            3. Payments & Refunds
          </h3>
          <p>
            All prices are subject to change. Refunds follow our official
            returns policy.
          </p>
        </section>

        <section className="bg-background p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            4. Contact Information
          </h3>
          <p>Email: legal@ssfashions.com</p>
          <p>Phone: +91 90000 00000</p>
        </section>
      </main>
    </div>
  );
};

export default TermsOfService;
