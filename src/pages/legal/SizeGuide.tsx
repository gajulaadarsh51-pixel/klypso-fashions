import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ruler, Shirt, User, ChevronLeft } from "lucide-react";

type Category = "Men" | "Women" | "Kids";

const sizeData = {
  Men: {
    headers: ["Size", "Chest (in)", "Waist (in)", "Hip (in)"],
    rows: [
      ["S", "36–38", "30–32", "36–38"],
      ["M", "38–40", "32–34", "38–40"],
      ["L", "40–42", "34–36", "40–42"],
      ["XL", "42–44", "36–38", "42–44"],
    ],
  },
  Women: {
    headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)"],
    rows: [
      ["XS", "30–32", "24–26", "34–36"],
      ["S", "32–34", "26–28", "36–38"],
      ["M", "34–36", "28–30", "38–40"],
      ["L", "36–38", "30–32", "40–42"],
      ["XL", "38–40", "32–34", "42–44"],
    ],
  },
  Kids: {
    headers: ["Age", "Height (cm)", "Chest (cm)", "Waist (cm)"],
    rows: [
      ["2–3", "92–98", "52–54", "50–52"],
      ["4–5", "104–110", "56–58", "54–56"],
      ["6–7", "116–122", "60–62", "56–58"],
      ["8–9", "128–134", "64–66", "58–60"],
    ],
  },
};

const SizeGuide = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("Men");

  const goToHome = () => {
    navigate("/");
  };

  const icons = {
    Men: <Shirt className="w-4 h-4 sm:w-5 sm:h-5" />,
    Women: <User className="w-4 h-4 sm:w-5 sm:h-5" />,
    Kids: <Ruler className="w-4 h-4 sm:w-5 sm:h-5" />,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      {/* HEADER */}
      <header className="border-b border-yellow-400/30 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
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
            className="text-center cursor-pointer"
            onClick={goToHome}
          >
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-yellow-500">
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

      {/* HERO */}
      <section className="bg-gradient-to-r from-black via-neutral-900 to-black text-center py-14 sm:py-20 px-4">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-yellow-400 mb-3 sm:mb-4">
          Size Guide
        </h2>
        <p className="max-w-xl mx-auto text-gray-300 text-xs sm:text-sm md:text-base">
          Find your perfect fit with our detailed size charts for Men, Women, and
          Kids. Measure once, shop confidently every time.
        </p>
      </section>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pb-20 -mt-12 sm:-mt-16 space-y-8 sm:space-y-10">
        {/* CATEGORY TABS */}
        <div className="bg-white shadow-xl rounded-2xl p-3 sm:p-6 flex flex-wrap justify-center gap-2 sm:gap-4">
          {(["Men", "Women", "Kids"] as Category[]).map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full border text-xs sm:text-sm font-medium transition w-full sm:w-auto justify-center
                  ${
                    active
                      ? "bg-yellow-500 text-white border-yellow-500"
                      : "border-yellow-400 text-yellow-500 hover:bg-yellow-100"
                  }`}
              >
                {icons[cat]}
                {cat}
              </button>
            );
          })}
        </div>

        {/* SIZE TABLE CARD */}
        <div className="bg-white border rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b bg-yellow-50">
            <h3 className="text-lg sm:text-2xl font-serif text-yellow-500">
              {category} Size Chart
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Measurements are approximate. For best results, measure your body
              and compare with the table below.
            </p>
          </div>

          {/* MOBILE SCROLL */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs sm:text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {sizeData[category].headers.map((h, i) => (
                    <th key={i} className="px-4 sm:px-6 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeData[category].rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-yellow-50 transition"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 sm:px-6 py-3 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MEASUREMENT TIPS */}
        <div className="bg-gradient-to-br from-black via-neutral-900 to-black text-white rounded-2xl p-4 sm:p-8 shadow-xl">
          <h3 className="text-lg sm:text-2xl font-serif text-yellow-400 mb-3 sm:mb-4">
            Measurement Tips
          </h3>

          <ul className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm md:text-base">
            <li>
              📏 <strong>Chest/Bust:</strong> Measure around the fullest part of
              your chest or bust.
            </li>
            <li>
              🧵 <strong>Waist:</strong> Measure around your natural waistline,
              just above your belly button.
            </li>
            <li>
              🪡 <strong>Hips:</strong> Measure around the widest part of your
              hips.
            </li>
            <li>
              👕 <strong>Fit Tip:</strong> If you're between sizes, choose the
              larger size for comfort.
            </li>
          </ul>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-6 text-center bg-white">
        <p className="text-gray-600 text-xs sm:text-sm">
          © 2024 SS Fashions. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 mt-3 text-xs sm:text-sm">
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

export default SizeGuide;