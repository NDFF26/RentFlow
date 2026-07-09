/**
 * RentFlow Workspace Layout Component
 * Features high-contrast navigation bar, responsive sidebar drawers,
 * and a global search trigger.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  CalendarDays,
  Undo2,
  FileBarChart2,
  ShieldAlert,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  PhoneCall,
  UserCheck
} from "lucide-react";

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { currentUser, settings, logout, license, bookings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser || !settings) return null;

  // Active notifications counter
  const pendingDeliveriesCount = bookings.filter(b => b.bookingStatus === "Confirmed").length;
  const overdueReturnsCount = bookings.filter(b => {
    const isDelivered = b.bookingStatus === "Delivered";
    const isPastDue = new Date(b.returnDate).getTime() < Date.now();
    return isDelivered && isPastDue;
  }).length;

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "bookings", label: "Bookings", icon: CalendarDays, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "returns", label: "Returns", icon: Undo2, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "inventory", label: "Inventory", icon: Package, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "categories", label: "Categories", icon: Layers, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "customers", label: "Customers", icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "reports", label: "Reports", icon: FileBarChart2, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: "staff", label: "Staff Portal", icon: UserCheck, roles: [UserRole.ADMIN] },
    { id: "logs", label: "Audit Logs", icon: ShieldAlert, roles: [UserRole.ADMIN] },
    { id: "profile", label: "My Profile", icon: User, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_PERSON] },
    { id: "settings", label: "Settings", icon: Settings, roles: [UserRole.ADMIN] }
  ];

  const filteredNavItems = navigationItems.filter(item => item.roles.includes(currentUser.role));

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  // Safe checks for warning licenses
  const getLicenseWarning = () => {
    if (!license) return null;
    const expiry = new Date(license.expiryDate).getTime();
    const diffDays = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays > 0) {
      return `License Expiring in ${diffDays} day(s). Action Required.`;
    }
    return null;
  };

  const warning = getLicenseWarning();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* EXPIRING LICENSE TOP NOTIFICATION BOX */}
      {warning && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-xs font-medium tracking-wide animate-pulse">
          ⚠️ {warning} <span className="underline ml-2 cursor-pointer font-bold" onClick={() => setCurrentTab("profile")}>Renew Now</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <img
              src={settings.companyLogo || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100&h=100&fit=crop&q=80"}
              alt="Logo"
              className="w-9 h-9 object-cover rounded-lg shadow-sm border border-slate-200"
            />
            <div className="hidden sm:block">
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight">
                {settings.companyName || "RentFlow"}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono -mt-1 tracking-wider uppercase font-semibold">
                SYSTEM OPERATOR
              </span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT TOOLBAR */}
        <div className="flex items-center space-x-3 md:space-x-5">
          {/* Active Worksite status badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Terminal</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>

          {/* Trigger Help WhatsApp */}
          <a
            href={`https://wa.me/${settings.whatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors relative"
            title="WhatsApp Helpline"
          >
            <PhoneCall className="w-5 h-5 text-emerald-600" />
          </a>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {(pendingDeliveriesCount + overdueReturnsCount) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>

            {/* Notification Pane */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 animate-fade-in text-xs text-slate-700">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="font-semibold text-slate-800">Operational Alerts</span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2 max-h-60 overflow-y-auto space-y-1">
                  {pendingDeliveriesCount > 0 ? (
                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">Pending Deliveries Available</p>
                        <p className="text-slate-500 text-[11px]">{pendingDeliveriesCount} bookings are confirmed and ready for dispatch.</p>
                      </div>
                    </div>
                  ) : null}

                  {overdueReturnsCount > 0 ? (
                    <div className="p-2 bg-rose-50/50 rounded-lg border border-rose-100 flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-rose-900">Overdue Returns Detected</p>
                        <p className="text-slate-500 text-[11px]">{overdueReturnsCount} bookings have crossed return date limits.</p>
                      </div>
                    </div>
                  ) : null}

                  {pendingDeliveriesCount === 0 && overdueReturnsCount === 0 && (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mb-2" />
                      <span>All systems nominal! No active alerts.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Staff Member Avatar Header */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
            <img
              src={currentUser.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80"}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden md:block text-left">
              <span className="block font-medium text-slate-800 text-xs leading-none">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider block mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* DESKTOP SIDEBAR - FIXED LEFT */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 select-none">
          <nav className="flex-1 p-4 space-y-1.5">
            {filteredNavItems.map(item => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <IconComp className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* FOOTER OF SIDEBAR - VERSION & LOGOUT */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono px-1">
              <span>App Version</span>
              <span>{settings.softwareVersion || "1.0.0"}</span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-rose-500" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR SLIDING DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
            />

            {/* Content box */}
            <div className="relative flex flex-col w-72 max-w-[80vw] bg-white h-full shadow-2xl z-50 animate-slide-up">
              <div className="h-16 border-b border-slate-100 px-5 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={settings.companyLogo}
                    alt="Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="font-display font-bold text-slate-800 text-base">{settings.companyName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map(item => {
                  const IconComp = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary-600 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconComp className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors border border-rose-100 bg-white"
                >
                  <LogOut className="w-4.5 h-4.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE CONTENT CONTAINER */}
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
