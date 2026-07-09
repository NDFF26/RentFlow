/**
 * RentFlow App - Main Routing & View Orchestrator
 * Integrates Global Providers, the premium prefill login screen,
 * and standard responsive workspace layouts.
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Toaster, toast } from "react-hot-toast";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Bookings } from "./components/Bookings";
import { Returns } from "./components/Returns";
import { Inventory } from "./components/Inventory";
import { Categories } from "./components/Categories";
import { Customers } from "./components/Customers";
import { Reports } from "./components/Reports";
import { Staff } from "./components/Staff";
import { Settings } from "./components/Settings";
import { Profile } from "./components/Profile";
import { ActivityLogs } from "./components/ActivityLogs";
import { Shield, Sparkles, Key, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

const MainApp: React.FC = () => {
  const { currentUser, login, isLoading } = useApp();
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Login form variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and security key.");
      return;
    }
    setIsAuthenticating(true);
    try {
      await login(email, password);
    } catch (err: any) {
      // toast notification is already triggered inside AppContext.tsx
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePrefill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    toast.success(`Credentials loaded. Click 'Sign In'!`);
  };

  // 1. LOGIN MODE VIEW (USER NOT AUTHENTICATED)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Subtle background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

        <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-8 space-y-6 animate-slide-up">
          
          {/* Logo & Branding Title */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg font-display font-black text-xl tracking-wider">
              RF
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">RentFlow Workspace</h1>
              <p className="text-xs text-slate-400 mt-0.5">Wedding Wear, Equipment & Camera Rental Management</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider mb-1.5">
                Operator Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@rentflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:bg-white rounded-xl focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider mb-1.5">
                Session Access Key
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:bg-white rounded-xl focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-primary-600/15 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>{isAuthenticating ? "Opening Session..." : "Sign In to Terminal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* FAST DEMO ACCESS PREFILLS - INCREDIBLY HELPFUL FOR PREVIEW AND TESTING */}
          <div className="border-t border-slate-100 pt-5 space-y-3.5">
            <span className="font-bold text-[10px] font-mono text-slate-400 block uppercase tracking-wider text-center">Fast Demo Prefill Channels</span>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePrefill("admin@rentflow.com", "admin123")}
                className="p-3 bg-slate-50/50 hover:bg-primary-50 hover:border-primary-200 border border-slate-100 rounded-xl text-left transition-all cursor-pointer"
              >
                <span className="font-bold text-slate-800 text-[11px] block">Admin Console</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Full operational control</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrefill("sales@rentflow.com", "sales123")}
                className="p-3 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-xl text-left transition-all cursor-pointer"
              >
                <span className="font-bold text-slate-800 text-[11px] block">Sales Terminal</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Dispatches & returns only</span>
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 pt-1 leading-normal">
            RentFlow Enterprise Suite. All transactions are logged chronologically under operational safety regulations.
          </p>
        </div>
      </div>
    );
  }

  // 2. ACTIVE SYSTEM TERMINAL VIEW (AUTHENTICATED SESSION)
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case "bookings":
        return <Bookings setCurrentTab={setCurrentTab} />;
      case "returns":
        return <Returns />;
      case "inventory":
        return <Inventory />;
      case "categories":
        return <Categories />;
      case "customers":
        return <Customers />;
      case "reports":
        return <Reports />;
      case "staff":
        return <Staff />;
      case "logs":
        return <ActivityLogs />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderTabContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <MainApp />
    </AppProvider>
  );
}
