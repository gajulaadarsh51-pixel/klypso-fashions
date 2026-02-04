import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Home,
  X,
  Sliders,
  Grid,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Header Slides", url: "/admin/header-slides", icon: Sliders },
  { title: "Header Icons", url: "/admin/header-icons", icon: Package },
  { title: "Home Categories", url: "/admin/home-categories", icon: Grid },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-primary text-primary-foreground
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* LOGO */}
        <div className="p-4 border-b border-primary-foreground/10 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg font-bold">SS FASHIONS</h1>
            <p className="text-xs text-primary-foreground/60">Admin Panel</p>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-primary-foreground/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg
                             text-primary-foreground/70 hover:text-primary-foreground
                             hover:bg-primary-foreground/10 transition-colors"
                  activeClassName="bg-gold text-primary font-medium"
                  onClick={handleNavClick}
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-primary-foreground/10 p-3">
          <div className="mb-3 px-3">
            <p className="text-xs font-medium truncate">{user?.email}</p>
            <p className="text-xs text-primary-foreground/60">Administrator</p>
          </div>

          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg
                       text-primary-foreground/70 hover:text-primary-foreground
                       hover:bg-primary-foreground/10 transition-colors text-sm"
            onClick={handleNavClick}
          >
            <Home size={18} />
            <span>View Store</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                       text-primary-foreground/70 hover:text-primary-foreground
                       hover:bg-primary-foreground/10 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
