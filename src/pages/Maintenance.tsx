import { useSettings } from '@/contexts/SettingsContext';
import { Home, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {settings.store_name}
          </h1>
          <p className="text-gray-600">Temporarily Unavailable</p>
        </div>

        {/* Maintenance Icon */}
        <div className="relative">
          <div className="w-40 h-40 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Site Under Maintenance</h2>
          <p className="text-gray-600 text-lg">
            We're currently performing scheduled maintenance to improve your shopping experience.
            Please check back soon!
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">For urgent inquiries:</h3>
          
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Mail size={18} />
            <a 
              href={`mailto:${settings.store_email}`} 
              className="hover:text-orange-500 transition-colors"
            >
              {settings.store_email}
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Phone size={18} />
            <a 
              href={`tel:${settings.store_phone}`} 
              className="hover:text-orange-500 transition-colors"
            >
              {settings.store_phone}
            </a>
          </div>
        </div>

        {/* Countdown (optional) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <p className="text-gray-700 mb-2">We'll be back online in:</p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24</div>
              <div className="text-sm text-gray-600">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">00</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
        </div>

        {/* Home Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
        >
          <Home size={20} />
          Return Home
        </Link>

        {/* Social Media (optional) */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Stay connected with us:</p>
          <div className="flex justify-center gap-6">
            {/* Add your social media links here */}
            <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
              Facebook
            </a>
            <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;