/**
 * RentFlow AppContext
 * Coordinates Global State, Active User Authentication, Licensing,
 * and Realtime Synchronization across all components.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AppUser,
  CompanySettings,
  License,
  LicenseStatus,
  Category,
  InventoryItem,
  Customer,
  Booking,
  ReturnRecord,
  ActivityLog,
  UserRole,
  BookingStatus
} from "../types";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";

interface AppContextType {
  currentUser: AppUser | null;
  settings: CompanySettings | null;
  license: License | null;
  isLoading: boolean;
  categories: Category[];
  items: InventoryItem[];
  customers: Customer[];
  bookings: Booking[];
  returns: ReturnRecord[];
  logs: ActivityLog[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCompanySettings: (updates: Partial<CompanySettings>) => Promise<void>;
  updateLicenseKey: (key: string) => Promise<void>;
  refreshAuth: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state pools
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Attempt auto-login of last session for testing comfort
  useEffect(() => {
    const savedUser = localStorage.getItem("rentflow_current_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("rentflow_current_user");
      }
    }

    // Subscribe to settings and license
    const unsubSettings = dbService.subscribe("settings", (data) => setSettings(data));
    const unsubLicense = dbService.subscribe("license", (data) => setLicense(data));

    // Subscribe to databases to maintain full live sync
    const unsubCats = dbService.subscribe("categories", (data) => setCategories(data));
    const unsubItems = dbService.subscribe("items", (data) => {
      // Sort items by SKU
      const sorted = [...data].sort((a, b) => a.sku.localeCompare(b.sku));
      setItems(sorted);
    });
    const unsubCust = dbService.subscribe("customers", (data) => setCustomers(data));
    const unsubBook = dbService.subscribe("bookings", (data) => setBookings(data));
    const unsubRet = dbService.subscribe("returns", (data) => setReturns(data));
    const unsubLogs = dbService.subscribe("logs", (data) => setLogs(data));

    setIsLoading(false);

    return () => {
      unsubSettings();
      unsubLicense();
      unsubCats();
      unsubItems();
      unsubCust();
      unsubBook();
      unsubRet();
      unsubLogs();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await dbService.login(email, password);
      setCurrentUser(res.user);
      setSettings(res.settings);
      setLicense(res.license);
      localStorage.setItem("rentflow_current_user", JSON.stringify(res.user));
      toast.success(`Welcome back, ${res.user.fullName}!`);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, "User logged out", "Authentication");
    }
    setCurrentUser(null);
    localStorage.removeItem("rentflow_current_user");
    toast.success("Successfully logged out.");
  };

  const updateCompanySettings = async (updates: Partial<CompanySettings>) => {
    try {
      const updated = await dbService.updateSettings(updates);
      setSettings(updated);
      if (currentUser) {
        await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, "Updated company branding settings", "Settings");
      }
      toast.success("Branding settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings.");
    }
  };

  const updateLicenseKey = async (key: string) => {
    try {
      // Basic key layout validation
      if (!key.startsWith("RF-") || key.length < 15) {
        throw new Error("Invalid license key format. Please enter a genuine commercial serial key.");
      }
      const updated = await dbService.updateLicense({
        licenseKey: key,
        status: LicenseStatus.ACTIVE,
        activationDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // extend 1 year
        updatedAt: new Date().toISOString()
      });
      setLicense(updated);
      if (currentUser) {
        await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Activated new product license key: ${key}`, "License");
      }
      toast.success("Product successfully activated! Full access granted.");
    } catch (err: any) {
      toast.error(err.message || "Invalid activation key.");
      throw err;
    }
  };

  const refreshAuth = () => {
    // Helper to refresh current user state in context
    const savedUser = localStorage.getItem("rentflow_current_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        settings,
        license,
        isLoading,
        categories,
        items,
        customers,
        bookings,
        returns,
        logs,
        login,
        logout,
        updateCompanySettings,
        updateLicenseKey,
        refreshAuth
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
