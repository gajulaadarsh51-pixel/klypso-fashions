import { useState } from "react";
import { X } from "lucide-react";
import AccountProfile from "@/pages/account/AccountProfile";

interface Props {
  open: boolean;
  onClose: () => void;
}

const AccountDrawer = ({ open, onClose }: Props) => {
  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">My Account</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="h-[calc(100%-64px)] overflow-y-auto">
          <AccountProfile />
        </div>
      </div>
    </>
  );
};

export default AccountDrawer;
