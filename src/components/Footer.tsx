import { useSettings } from '@/contexts/SettingsContext';
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from 'react-router-dom';

const Footer = () => {
  const { settings, loading, getStoreNameParts } = useSettings();

  if (loading) {
    return (
      <footer className="hidden md:block bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-primary-foreground/70">
            Loading store information...
          </div>
        </div>
      </footer>
    );
  }

  // Get store name parts
  const nameParts = getStoreNameParts();

  return (
    <footer className="hidden md:block bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* BRAND */}
          <div>
            <h2 className="font-heading text-2xl font-bold mb-4">
              <span style={{ color: settings.first_name_color }}>
                {nameParts.firstPart}
              </span>
              <span style={{ color: settings.second_name_color }}>
                {nameParts.secondPart}
              </span>
            </h2>
            <p className="text-sm text-primary-foreground/70 mb-6 leading-relaxed">
              Curating timeless elegance and contemporary style for the modern
              wardrobe.
            </p>

            {/* CONTACT INFO FROM SETTINGS */}
            <div className="mb-6 space-y-2">
              <p className="text-sm text-primary-foreground/80">
                {settings.store_email}
              </p>
              <p className="text-sm text-primary-foreground/80">
                {settings.store_phone}
              </p>
            </div>

            <div className="flex gap-4">
              <a
                href="#"
                className="hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="hover:text-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="hover:text-gold transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* SHOP */}
          <div>
            <h3 className="font-medium text-sm tracking-wider mb-6">SHOP</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link
                  to="/products?category=Women"
                  className="hover:text-gold transition-colors"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=Men"
                  className="hover:text-gold transition-colors"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=Accessories"
                  className="hover:text-gold transition-colors"
                >
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-gold transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sale=true"
                  className="hover:text-gold transition-colors"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* HELP */}
          <div>
            <h3 className="font-medium text-sm tracking-wider mb-6">HELP</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link
                  to="/legal/contact"
                  className="hover:text-gold transition-colors"
                >
                  Contact Us
                </Link>
              </li>

              <li>
                <Link
                  to="/legal/faq"
                  className="hover:text-gold transition-colors"
                >
                  FAQs
                </Link>
              </li>

              <li>
                <Link
                  to="/legal/shipping-returns"
                  className="hover:text-gold transition-colors"
                >
                  Shipping & Returns
                </Link>
              </li>

              <li>
                <Link
                  to="/legal/size-guide"
                  className="hover:text-gold transition-colors"
                >
                  Size Guide
                </Link>
              </li>

              <li>
                <a
                  href="#"
                  className="hover:text-gold transition-colors"
                >
                  Track Order
                </a>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="font-medium text-sm tracking-wider mb-6">
              NEWSLETTER
            </h3>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Subscribe for exclusive offers and new arrivals.
            </p>

            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="bg-transparent border-b border-primary-foreground/30 py-2 text-sm outline-none focus:border-gold transition-colors placeholder:text-primary-foreground/50"
              />
              <button
                type="submit"
                className="btn-gold text-xs py-2"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/50">
            <p>
              © {new Date().getFullYear()}{" "}
              <span style={{ color: settings.first_name_color }}>
                {nameParts.firstPart}
              </span>
              <span style={{ color: settings.second_name_color }}>
                {nameParts.secondPart}
              </span>
              . All rights reserved.
            </p>

            <div className="flex gap-6">
              <Link
                to="/privacy"
                className="hover:text-gold transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-gold transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;