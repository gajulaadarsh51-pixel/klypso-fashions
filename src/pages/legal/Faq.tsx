import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  RefreshCcw,
  Ruler,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  ChevronLeft,
} from "lucide-react";

type FAQItem = {
  q: string;
  a: string;
};

type Category = {
  title: string;
  icon: JSX.Element;
  items: FAQItem[];
};

const categories: Category[] = [
  {
    title: "Ordering & Shipping",
    icon: <Truck className="text-gold" />,
    items: [
      {
        q: "How long does shipping take?",
        a: "We offer standard shipping (5–7 business days) and express shipping (2–3 business days). Shipping times may vary during holiday seasons or sale events. You'll receive a tracking number once your order ships.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes! We currently ship to over 50 countries worldwide. International shipping typically takes 10–15 business days. Additional customs fees or taxes may apply depending on your country's regulations.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "You can modify or cancel your order within 1 hour of placing it by contacting our customer service. After that, orders are processed for shipping and cannot be changed. Please refer to our return policy if changes are needed later.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order ships, you'll receive an email with a tracking number. You can also log into your SS Fashions account to view all order statuses in your dashboard.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    icon: <RefreshCcw className="text-gold" />,
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy from the date of delivery. Items must be unworn, unwashed, and have original tags attached. Domestic returns are free. International returns may require shipping fees.",
      },
      {
        q: "How do I initiate a return or exchange?",
        a: "Log into your account, go to Order History, select the item, and follow the return/exchange steps. You can also contact our support team for help and return label instructions.",
      },
      {
        q: "How long does it take to process a refund?",
        a: "Refunds are processed within 3–5 business days after we receive your return. Banks may take 5–10 additional business days to reflect the amount.",
      },
      {
        q: "Are there any non-returnable items?",
        a: "Underwear, swimwear, earrings, and items marked as Final Sale cannot be returned unless defective.",
      },
    ],
  },
  {
    title: "Sizing & Fit",
    icon: <Ruler className="text-gold" />,
    items: [
      {
        q: "How do I find my correct size?",
        a: "Each product page includes a detailed size guide in inches and centimeters. Measure yourself and compare with our chart for the best fit.",
      },
      {
        q: "What if the item doesn't fit?",
        a: "You can exchange the item for a different size (subject to availability) or return it for a refund at no extra cost.",
      },
      {
        q: "Do your clothes run true to size?",
        a: "Most of our clothing runs true to size, but some styles may vary. Check the product-specific size chart and customer reviews for guidance.",
      },
    ],
  },
  {
    title: "Payments & Security",
    icon: <CreditCard className="text-gold" />,
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Visa, MasterCard, American Express, Discover, PayPal, Apple Pay, and Google Pay. All payments are securely encrypted.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. We use SSL encryption and follow PCI DSS standards. We never store your full credit card information.",
      },
      {
        q: "Do you offer gift cards?",
        a: "Yes! Gift cards are available from ₹500 to ₹10,000 and can be used for any online purchase. They never expire.",
      },
    ],
  },
];

const Faq = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Record<number, number | null>>({});

  const toggle = (catIndex: number, itemIndex: number) => {
    setOpen((prev) => ({
      ...prev,
      [catIndex]: prev[catIndex] === itemIndex ? null : itemIndex,
    }));
  };

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* HEADER */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {/* Back Button - Small arrow button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Title - Clickable for Home */}
          <div 
            className="flex-1 text-center cursor-pointer"
            onClick={goToHome}
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gold">
              SS FASHIONS
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Your one-stop destination for the latest trends
            </p>
          </div>
        </div>
      </header>

      {/* TITLE */}
      <section className="max-w-4xl mx-auto text-center px-6 py-12">
        <h2 className="text-3xl sm:text-4xl font-serif text-gold mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Find answers to common questions about shopping at SS Fashions. If you
          don't find what you're looking for, our support team is here to help.
        </p>
      </section>

      {/* FAQ GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, catIndex) => (
          <div
            key={catIndex}
            className="bg-background rounded-xl p-6 shadow border"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full border">
                {cat.icon}
              </div>
              <h3 className="text-xl font-semibold text-gold">
                {cat.title}
              </h3>
            </div>

            {cat.items.map((faq, itemIndex) => {
              const isOpen = open[catIndex] === itemIndex;

              return (
                <div
                  key={itemIndex}
                  className="border-b last:border-none py-3"
                >
                  <button
                    onClick={() => toggle(catIndex, itemIndex)}
                    className="w-full flex justify-between items-center text-left font-medium text-primary hover:text-gold transition"
                  >
                    {faq.q}
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {isOpen && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      {/* CONTACT BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-background rounded-xl p-6 sm:p-8 text-center shadow border">
          <h3 className="text-2xl font-serif text-gold mb-3">
            Still Have Questions?
          </h3>
          <p className="text-muted-foreground mb-4">
            Our customer support team is available 7 days a week to help you
            with orders, sizing, or anything else you need.
          </p>
          <a
            href="mailto:support@ssfashions.com"
            className="inline-block bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition"
          >
            Contact Customer Support
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background text-center py-8 border-t">
        <p className="text-primary font-medium">
          © 2024 SS Fashions. All rights reserved.
        </p>

        <div className="flex justify-center gap-4 mt-3">
          <a href="#" className="text-primary hover:text-gold">
            <Instagram size={18} />
          </a>
          <a href="#" className="text-primary hover:text-gold">
            <Facebook size={18} />
          </a>
        </div>

        <div className="flex justify-center gap-6 mt-4 text-sm">
          <Link to="/privacy" className="hover:text-gold">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-gold">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Faq;