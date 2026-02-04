import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";

const PublicLayout = () => {
  return (
    <>
      <Header />

      {/* All public pages render here */}
      <main className="min-h-[calc(100vh-120px)]">
        <Outlet />
      </main>

      <Footer />
      <BottomNavigation />
    </>
  );
};

export default PublicLayout;
