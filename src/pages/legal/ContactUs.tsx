import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle, Send, ChevronLeft } from "lucide-react";

const WHATSAPP_NUMBER = "919876543210"; // no +

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = `
SS Fashions Contact Form

Name: ${form.name}
Email: ${form.email}
Message: ${form.message}
    `;

    const encodedText = encodeURIComponent(text);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`,
      "_blank"
    );
  };

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* HEADER */}
      <header className="border-b sticky top-0 z-50 bg-white">
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
            <h1 className="text-2xl font-serif font-bold text-yellow-500">
              SS FASHIONS
            </h1>
            <p className="text-xs text-gray-500">
              Elegant Styles for Every Occasion
            </p>
          </div>

          {/* Spacer for mobile to balance layout */}
          <div className="sm:hidden w-10"></div>
        </div>
      </header>

      {/* HERO — DARK LIKE IMAGE */}
      <section className="bg-gradient-to-r from-black via-neutral-900 to-black text-center py-20 px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-4">
          Contact Us
        </h2>
        <p className="max-w-xl mx-auto text-gray-300 text-sm sm:text-base">
          We'd love to hear from you. Reach out for orders, support, or custom
          fashion inquiries.
        </p>
      </section>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-10 -mt-16">
        {/* LEFT — APP STYLE CARD (LIKE IMAGE) */}
        <div className="bg-gradient-to-br from-black via-neutral-900 to-black text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl font-serif text-yellow-400 mb-4">
            📱 Get In Touch
          </h3>

          <p className="text-gray-300 mb-6 text-sm sm:text-base">
            Contact SS Fashions for orders, custom designs, tracking, and
            support. We're always happy to help.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/20 p-3 rounded-full">
                <Phone className="text-yellow-400 w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-gray-300 text-sm">
                  +91 98765 43210
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/20 p-3 rounded-full">
                <Mail className="text-yellow-400 w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-300 text-sm">
                  support@ssfashions.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/20 p-3 rounded-full">
                <MapPin className="text-yellow-400 w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-300 text-sm">
                  Fashion Street, Mumbai, India
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border border-yellow-400/30 rounded-xl p-4 sm:p-6 bg-yellow-400/5">
            <h4 className="text-lg font-serif text-yellow-400 mb-2">
              Business Hours
            </h4>
            <p className="text-gray-300 text-sm">
              Mon – Sat: 10 AM – 8 PM
            </p>
            <p className="text-gray-300 text-sm">
              Sunday: 11 AM – 6 PM
            </p>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl font-serif text-yellow-500 mb-6 text-center md:text-left">
            Send Us a Message
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500"
                placeholder="Type your message"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <Send size={18} />
              Send via WhatsApp
            </button>
          </form>
        </div>
      </main>

      {/* FLOATING WHATSAPP */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 bg-green-500 hover:bg-green-400 p-4 rounded-full shadow-xl transition z-[9999]"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="text-white w-6 h-6" />
      </a>

      {/* FOOTER */}
      <footer className="border-t py-8 text-center bg-white mt-10">
        <p className="text-gray-600 text-sm">
          © 2024 SS Fashions. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 mt-3 text-sm">
          <Link to="/privacy" className="hover:text-yellow-500">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-yellow-500">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;