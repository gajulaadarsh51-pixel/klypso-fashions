import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  MapPin,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Phone,
  Truck,
  Ruler,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ---------------- TYPES ---------------- */
interface Address {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

type Mode = "view" | "edit-profile" | "addresses";

type AvatarType = "man" | "woman" | "kid" | "default";

interface AvatarOption {
  type: AvatarType;
  label: string;
  svg: React.ReactNode;
}

/* ---------------- ANIMATED AVATAR COMPONENTS ---------------- */
const AnimatedManAvatar = ({ size = 80, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`text-blue-500 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
      `}
    </style>
    <circle cx="50" cy="50" r="48" fill="currentColor" className="pulse-animation opacity-10" />
    <g className="float-animation">
      <circle cx="50" cy="35" r="12" fill="currentColor" opacity="0.9" />
      <path d="M40,50 L60,50 L55,75 L45,75 Z" fill="currentColor" opacity="0.9" />
      <path d="M35,50 Q50,45 65,50" stroke="currentColor" strokeWidth="3" fill="none" />
    </g>
  </svg>
);

const AnimatedWomanAvatar = ({ size = 80, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`text-pink-500 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes hair-sway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        .hair-animation {
          animation: hair-sway 4s ease-in-out infinite;
        }
      `}
    </style>
    <circle cx="50" cy="50" r="48" fill="currentColor" className="pulse-animation opacity-10" />
    <g className="float-animation">
      <circle cx="50" cy="35" r="12" fill="currentColor" opacity="0.9" />
      <g className="hair-animation">
        <ellipse cx="50" cy="42" rx="15" ry="8" fill="currentColor" opacity="0.8" />
      </g>
      <path d="M40,50 L60,50 Q50,65 40,75 Q50,70 60,75 Q50,65 60,50" fill="currentColor" opacity="0.9" />
    </g>
  </svg>
);

const AnimatedKidAvatar = ({ size = 80, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`text-green-500 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        .bounce-animation {
          animation: bounce 2s ease-in-out infinite;
        }
        .pulse-animation {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .wiggle-animation {
          animation: wiggle 3s ease-in-out infinite;
        }
      `}
    </style>
    <circle cx="50" cy="50" r="48" fill="currentColor" className="pulse-animation opacity-10" />
    <g className="bounce-animation">
      <circle cx="50" cy="40" r="15" fill="currentColor" opacity="0.9" />
      <path d="M35,60 L65,60 Q50,85 35,60" fill="currentColor" opacity="0.9" className="wiggle-animation" />
      <circle cx="40" cy="35" r="3" fill="white" />
      <circle cx="60" cy="35" r="3" fill="white" />
      <path d="M45,45 Q50,50 55,45" stroke="white" strokeWidth="2" fill="none" />
    </g>
  </svg>
);

const AnimatedDefaultAvatar = ({ size = 80, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`text-purple-500 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .rotate-animation {
          animation: rotate 20s linear infinite;
        }
        .pulse-animation {
          animation: pulse 3s ease-in-out infinite;
        }
        .shimmer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
      `}
    </style>
    <g className="rotate-animation">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </g>
    <g className="pulse-animation">
      <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.9" />
      <circle cx="50" cy="45" r="8" fill="white" opacity="0.8" />
      <circle cx="50" cy="55" r="4" fill="white" opacity="0.8" />
      <path d="M40,35 Q50,30 60,35" stroke="white" strokeWidth="1" fill="none" opacity="0.8" />
    </g>
    <rect className="shimmer-overlay" fill="url(#shimmer-gradient)" />
    <defs>
      <linearGradient id="shimmer-gradient">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
  </svg>
);

/* ---------------- CONSTANTS ---------------- */
const AVATAR_OPTIONS: AvatarOption[] = [
  { 
    type: "man", 
    label: "Man", 
    svg: <AnimatedManAvatar size={60} />
  },
  { 
    type: "woman", 
    label: "Woman", 
    svg: <AnimatedWomanAvatar size={60} />
  },
  { 
    type: "kid", 
    label: "Kid", 
    svg: <AnimatedKidAvatar size={60} />
  },
  { 
    type: "default", 
    label: "Default", 
    svg: <AnimatedDefaultAvatar size={60} />
  },
];

/* ---------------- COMPONENT ---------------- */
const AccountProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("view");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<AvatarType>("default");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [showLegal, setShowLegal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const emptyAddress: Omit<Address, 'id' | 'created_at'> = {
    user_id: user?.id || "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "India",
    is_default: false,
  };

  const [addressForm, setAddressForm] = useState<Partial<Address>>(emptyAddress);

  /* ---------------- LOAD PROFILE ---------------- */
  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_type")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setName(data.full_name || "");
      setPhone(data.phone || "");
      setAvatar((data.avatar_type as AvatarType) || "default");
    } else {
      setName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
      setAvatar("default");
    }
  };

  /* ---------------- LOAD ADDRESSES ---------------- */
  const loadAddresses = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadProfile();
      loadAddresses();
    }
  }, [user]);

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          phone: phone,
        },
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: name,
          phone: phone,
          avatar_type: avatar,
          updated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success("Profile updated successfully");
      setMode("view");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---------------- GET AVATAR COMPONENT ---------------- */
  const getAvatarComponent = (type: AvatarType, size: number = 120) => {
    switch (type) {
      case "man":
        return <AnimatedManAvatar size={size} className="drop-shadow-lg" />;
      case "woman":
        return <AnimatedWomanAvatar size={size} className="drop-shadow-lg" />;
      case "kid":
        return <AnimatedKidAvatar size={size} className="drop-shadow-lg" />;
      default:
        return <AnimatedDefaultAvatar size={size} className="drop-shadow-lg" />;
    }
  };

  /* ---------------- ADDRESS ACTIONS ---------------- */
  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm(addr);
    setShowAddressForm(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      ...emptyAddress,
      user_id: user?.id || "",
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;

    const { error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", id);

    if (!error) {
      toast.success("Address deleted");
      loadAddresses();
    } else {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    try {
      const { error: resetError } = await supabase
        .from("shipping_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      if (resetError) throw resetError;

      const { error } = await supabase
        .from("shipping_addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Default address updated");
      loadAddresses();
    } catch (error: any) {
      console.error("Failed to update default address:", error);
      toast.error("Failed to update default address");
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    try {
      const payload = {
        ...addressForm,
        user_id: user.id,
      };

      if (!editingAddress) {
        delete payload.id;
      }

      if (payload.is_default) {
        const { error: resetError } = await supabase
          .from("shipping_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);

        if (resetError) throw resetError;
      }

      const { data, error } = editingAddress 
        ? await supabase
            .from("shipping_addresses")
            .update(payload)
            .eq("id", editingAddress.id)
            .select()
        : await supabase
            .from("shipping_addresses")
            .insert([payload])
            .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success(editingAddress ? "Address updated" : "Address saved successfully");
      setShowAddressForm(false);
      setEditingAddress(null);
      loadAddresses();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address. Please check all fields.");
    }
  };

  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
  };

  /* ---------------- SCROLL WRAPPER ---------------- */
  return (
    <div className="h-full max-h-screen overflow-y-auto pb-28">
      {mode === "view" && (
        <div className="p-6 space-y-8">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Profile
          </h1>

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div 
              className="relative group cursor-pointer transform transition-transform hover:scale-105 active:scale-95"
              onClick={() => setShowAvatarSelector(true)}
            >
              <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-muted/30 to-background flex items-center justify-center p-2 shadow-lg border border-primary/10">
                {getAvatarComponent(avatar, 140)}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/90 p-3 rounded-full shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                  <Edit className="text-primary" size={24} />
                </div>
              </div>
            </div>
            
            {/* Avatar Selector Modal */}
            {showAvatarSelector && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-background rounded-2xl p-8 max-w-md w-full border border-primary/20 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                      Choose Your Avatar
                    </h3>
                    <button 
                      onClick={() => setShowAvatarSelector(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    {AVATAR_OPTIONS.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => {
                          setAvatar(option.type);
                          setShowAvatarSelector(false);
                        }}
                        className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-300 transform hover:-translate-y-1 ${
                          avatar === option.type
                            ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg scale-105"
                            : "border-muted hover:border-primary/50 bg-gradient-to-br from-background to-muted/20 hover:shadow-md"
                        }`}
                      >
                        <div className={`${avatar === option.type ? "scale-110" : ""} transition-transform duration-300`}>
                          {option.svg}
                        </div>
                        <span className={`font-medium ${avatar === option.type ? "text-primary" : "text-foreground"}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowAvatarSelector(false)}
                    className="w-full py-3 px-4 border border-muted rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {name || "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email || "Active account"}
              </p>
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mx-auto px-4 py-2 rounded-full border border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15"
              >
                <Edit size={14} />
                Change Avatar
              </button>
            </div>
          </div>

          {/* MENU */}
          <div className="bg-gradient-to-b from-background to-muted/30 border border-primary/10 rounded-2xl divide-y divide-primary/5 overflow-hidden shadow-sm">
            <button
              onClick={() => setMode("edit-profile")}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-muted/50 transition-all hover:pl-8 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Edit size={20} className="text-primary" />
              </div>
              <span className="font-medium">Edit Profile</span>
            </button>

            <button
              onClick={() => setMode("addresses")}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-muted/50 transition-all hover:pl-8 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <MapPin size={20} className="text-blue-500" />
              </div>
              <span className="font-medium">Shipping Addresses</span>
            </button>

            {/* LEGAL */}
            <button
              onClick={() => setShowLegal(!showLegal)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <HelpCircle size={20} className="text-purple-500" />
                </div>
                <span className="font-medium">Legal & Help</span>
              </div>
              {showLegal ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>

            {showLegal && (
              <div className="bg-gradient-to-b from-muted/20 to-transparent animate-in slide-in-from-top-2">
                {[
                  { icon: Phone, label: "Contact Us", color: "text-green-500", bg: "bg-green-500/10", path: "/legal/contact" },
                  { icon: HelpCircle, label: "FAQ", color: "text-purple-500", bg: "bg-purple-500/10", path: "/legal/faq" },
                  { icon: Truck, label: "Shipping & Returns", color: "text-orange-500", bg: "bg-orange-500/10", path: "/legal/shipping-returns" },
                  { icon: Ruler, label: "Size Guide", color: "text-cyan-500", bg: "bg-cyan-500/10", path: "/legal/size-guide" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-4 px-10 py-4 hover:bg-muted/30 transition-all hover:pl-12 group"
                  >
                    <div className={`p-2 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                      <item.icon size={18} className={item.color} />
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-6 py-5 text-destructive hover:bg-destructive/10 transition-all hover:pl-8 group"
            >
              <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                <LogOut size={20} className="text-destructive" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {mode === "edit-profile" && (
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMode("view")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Edit Profile
            </h1>
          </div>

          <div className="bg-gradient-to-br from-background to-muted/20 p-8 border border-primary/10 rounded-2xl space-y-8 shadow-sm">
            {/* Avatar Selection in Edit Mode */}
            <div>
              <label className="block text-sm font-medium mb-6 text-center">Choose Your Avatar</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setAvatar(option.type)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all duration-300 transform hover:scale-105 ${
                      avatar === option.type
                        ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
                        : "border-muted hover:border-primary/50 bg-gradient-to-br from-background to-muted/10 hover:shadow-md"
                    }`}
                  >
                    {option.svg}
                    <span className={`text-xs font-medium ${avatar === option.type ? "text-primary" : "text-muted-foreground"}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Full Name</label>
                <input
                  className="input-elegant w-full bg-gradient-to-r from-background to-muted/20 border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Email</label>
                <input
                  className="input-elegant w-full bg-gradient-to-r from-muted/10 to-muted/20 border-primary/10"
                  value={user?.email || ""}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Phone</label>
                <input
                  className="input-elegant w-full bg-gradient-to-r from-background to-muted/20 border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn-primary w-full disabled:opacity-50 py-4 text-lg font-medium bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {savingProfile ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Profile"}
            </button>
          </div>
        </div>
      )}

      {mode === "addresses" && (
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMode("view")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Saved Addresses
            </h1>
          </div>

          <button
            onClick={handleAddNewAddress}
            className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors group"
          >
            <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Plus size={20} />
            </div>
            <span className="font-medium">Add New Address</span>
          </button>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading addresses...</p>
            </div>
          )}

          {showAddressForm && (
            <div className="bg-gradient-to-br from-background to-muted/20 p-6 border border-primary/10 rounded-xl space-y-4 animate-in slide-in-from-bottom-2">
              <h2 className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {editingAddress ? "Edit Address" : "New Address"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    ["first_name", "First Name", "text"],
                    ["last_name", "Last Name", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                    ["address", "Address", "text"],
                    ["city", "City", "text"],
                    ["state", "State", "text"],
                    ["zip_code", "Zip Code", "text"],
                    ["country", "Country", "text"],
                  ] as [keyof Address, string, string][]
                ).map(([key, label, type]) => (
                  <div key={key} className={key === 'address' || key === 'country' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm mb-2 font-medium">
                      {label} {key !== 'country' && <span className="text-red-500">*</span>}
                    </label>
                    {key === 'country' ? (
                      <select
                        className="input-elegant w-full bg-gradient-to-r from-background to-muted/10 border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        value={addressForm[key] || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            [key]: e.target.value,
                          })
                        }
                      >
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    ) : (
                      <input
                        type={type}
                        className="input-elegant w-full bg-gradient-to-r from-background to-muted/10 border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        value={addressForm[key] || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            [key]: e.target.value,
                          })
                        }
                        required={key !== 'country'}
                      />
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default || false}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      is_default: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-primary rounded border-primary/30 focus:ring-primary/20"
                />
                <span className="font-medium">Set as default address</span>
              </label>

              <div className="flex gap-4 pt-6">
                <button
                  className="btn-outline flex-1 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={handleCancelAddress}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleSaveAddress}
                  disabled={!addressForm.first_name || !addressForm.last_name || 
                           !addressForm.email || !addressForm.phone || 
                           !addressForm.address || !addressForm.city || 
                           !addressForm.state || !addressForm.zip_code}
                >
                  {editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </div>
          )}

          {!showAddressForm && addresses.length === 0 && !loading && (
            <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-2xl bg-gradient-to-b from-background to-muted/10">
              <MapPin size={64} className="mx-auto text-primary/40 mb-6" />
              <p className="text-muted-foreground text-lg mb-2">No saved addresses yet</p>
              <p className="text-sm text-muted-foreground mb-6">Add your first address to get started</p>
              <button
                onClick={handleAddNewAddress}
                className="inline-flex items-center gap-2 px-6 py-3 text-primary hover:text-primary/80 transition-colors bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 rounded-full border border-primary/20 hover:border-primary/40"
              >
                <Plus size={18} />
                Add your first address
              </button>
            </div>
          )}

          {!showAddressForm && addresses.length > 0 && (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-6 border border-primary/10 rounded-xl text-sm space-y-3 bg-gradient-to-br from-background to-muted/5 hover:to-muted/10 transition-all hover:shadow-lg hover:border-primary/20 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-bold text-base">
                          {addr.first_name} {addr.last_name}
                        </p>
                        {addr.is_default && (
                          <span className="text-xs bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-600 px-3 py-1.5 rounded-full border border-green-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin size={14} className="text-primary/60" />
                          {addr.address}
                        </p>
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} {addr.zip_code}
                        </p>
                        <p className="text-muted-foreground">{addr.country}</p>
                        <p className="text-muted-foreground pt-2 flex items-center gap-2">
                          <Phone size={14} className="text-blue-500/60" />
                          {addr.phone}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-purple-600" />
                          {addr.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      {!addr.is_default && (
                        <button 
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-2 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-colors"
                          title="Set as default"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditAddress(addr)}
                        className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit address"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete address"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountProfile;