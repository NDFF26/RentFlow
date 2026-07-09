/**
 * RentFlow Unified Database & Storage Service (Firebase integrated)
 * Version 2.0.0
 * Supports real-time cloud operations on Firebase Firestore, automatic dynamic seeding,
 * and robust security rule-compliant data manipulation.
 */

import {
  UserRole,
  UserStatus,
  AppUser,
  CompanySettings,
  License,
  LicenseStatus,
  Category,
  InventoryItem,
  ItemStatus,
  Customer,
  Booking,
  BookingItem,
  BookingStatus,
  ReturnRecord,
  ReturnStatus,
  ActivityLog
} from "../types";

import { db, OperationType, handleFirestoreError } from "./firebase";
import { BRAND_CONFIG } from "../brandConfig";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocFromServer
} from "firebase/firestore";

// Test connection on startup as required by security guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// Default Seeding Data
const DEFAULT_SETTINGS: CompanySettings = {
  companyName: BRAND_CONFIG.companyName,
  companyLogo: BRAND_CONFIG.companyLogo,
  themeColor: BRAND_CONFIG.themeColor,
  phone: BRAND_CONFIG.phone,
  email: BRAND_CONFIG.email,
  whatsAppNumber: BRAND_CONFIG.whatsAppNumber,
  invoicePrefix: BRAND_CONFIG.invoicePrefix,
  currency: BRAND_CONFIG.currency,
  gstEnabled: BRAND_CONFIG.gstEnabled,
  gstNumber: BRAND_CONFIG.gstNumber,
  depositEnabled: true,
  softwareVersion: "1.0.0",
  timezone: BRAND_CONFIG.timezone,
  country: BRAND_CONFIG.country,
  state: BRAND_CONFIG.state,
  city: BRAND_CONFIG.city,
  businessAddress: BRAND_CONFIG.businessAddress,
  businessDescription: BRAND_CONFIG.businessDescription,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const DEFAULT_LICENSE: License = {
  id: "lic-prod-001",
  licenseKey: "RF-TRIAL-9923-8812-4012",
  status: LicenseStatus.ACTIVE,
  activationDate: new Date().toISOString(),
  expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
  maximumUsers: 10,
  registeredEmail: "velocityptc@gmail.com",
  currentVersion: "1.0.0",
  lastVerification: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const DEFAULT_USERS: AppUser[] = [
  {
    id: "user-admin-01",
    fullName: "Amit Sharma",
    email: "admin@rentflow.com",
    phone: "+91 99887 76655",
    role: UserRole.ADMIN,
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80",
    status: UserStatus.ACTIVE,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "user-manager-01",
    fullName: "Sanjay Kumar",
    email: "manager@rentflow.com",
    phone: "+91 77665 54433",
    role: UserRole.MANAGER,
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&q=80",
    status: UserStatus.ACTIVE,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "user-sales-01",
    fullName: "Rohit Verma",
    email: "sales@rentflow.com",
    phone: "+91 88776 65544",
    role: UserRole.SALES_PERSON,
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80",
    status: UserStatus.ACTIVE,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-01", categoryName: "Wedding Wear", description: "Designer Bridal Dresses, Sherwanis, and Gowns", status: "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-02", categoryName: "Photography", description: "Professional DSLRs, Lenses, and Studio Lighting", status: "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-03", categoryName: "Sound & Audio", description: "JBL Speakers, Cordless Mics, and Mixers", status: "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-04", categoryName: "Event Decor", description: "Mandaps, Stages, Lighting, and Props", status: "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: "item-01",
    sku: "SHRW-001",
    itemName: "Premium Royal Velvet Sherwani (Ivory Gold)",
    categoryId: "cat-01",
    categoryName: "Wedding Wear",
    description: "Zardozi hand-crafted royal ivory velvet sherwani with matching stole and safa accessories.",
    rentPrice: 6500,
    securityDeposit: 5000,
    quantity: 5,
    availableQuantity: 4,
    bookedQuantity: 1,
    outQuantity: 0,
    maintenanceQuantity: 0,
    lostQuantity: 0,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop&q=80",
    status: ItemStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "item-02",
    sku: "LEHN-002",
    itemName: "Sabyasachi-Inspired Crimson Bridal Lehenga",
    categoryId: "cat-01",
    categoryName: "Wedding Wear",
    description: "Heavy hand embroidery bridal lehenga set in crimson red silk with dual sheer dupattas.",
    rentPrice: 12000,
    securityDeposit: 10000,
    quantity: 3,
    availableQuantity: 2,
    bookedQuantity: 1,
    outQuantity: 0,
    maintenanceQuantity: 0,
    lostQuantity: 0,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop&q=80",
    status: ItemStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "item-03",
    sku: "CAM-SONY7M4",
    itemName: "Sony Alpha 7 IV Full-Frame Mirrorless Camera",
    categoryId: "cat-02",
    categoryName: "Photography",
    description: "33MP Exmor R sensor mirrorless body with dual slots. Pristine video & photo performance.",
    rentPrice: 2500,
    securityDeposit: 8000,
    quantity: 4,
    availableQuantity: 3,
    bookedQuantity: 0,
    outQuantity: 1,
    maintenanceQuantity: 0,
    lostQuantity: 0,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop&q=80",
    status: ItemStatus.OUT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "item-04",
    sku: "SND-JBL500",
    itemName: "JBL PartyBox 500w Professional Speaker",
    categoryId: "cat-03",
    categoryName: "Sound & Audio",
    description: "High-power party speaker with deep bass, Bluetooth connectivity, and dual mic input slots.",
    rentPrice: 1500,
    securityDeposit: 3000,
    quantity: 8,
    availableQuantity: 8,
    bookedQuantity: 0,
    outQuantity: 0,
    maintenanceQuantity: 0,
    lostQuantity: 0,
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop&q=80",
    status: ItemStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "item-05",
    sku: "LNS-2470GM",
    itemName: "Sony FE 24-70mm f/2.8 GM II Lens",
    categoryId: "cat-02",
    categoryName: "Photography",
    description: "Ultimate standard zoom lens with ultra-fast autofocus and beautiful corner-to-corner contrast.",
    rentPrice: 1800,
    securityDeposit: 5000,
    quantity: 3,
    availableQuantity: 2,
    bookedQuantity: 0,
    outQuantity: 0,
    maintenanceQuantity: 1,
    lostQuantity: 0,
    imageUrl: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=400&fit=crop&q=80",
    status: ItemStatus.MAINTENANCE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    customerName: "Rahul Deshmukh",
    mobileNumber: "9820098200",
    alternateMobile: "9820098201",
    address: "Apt 202, Silver Sands, Juhu Tara Road",
    city: "Mumbai",
    notes: "VIP Customer. Prefers pristine condition wedding outfits.",
    totalBookings: 2,
    currentDeposit: 15000,
    status: "Active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "cust-02",
    customerName: "Priyanka Patel",
    mobileNumber: "9769976997",
    address: "Villa 12, Windermere Society, Oshiwara",
    city: "Mumbai",
    notes: "Independent wedding photographer coordinator.",
    totalBookings: 1,
    currentDeposit: 8000,
    status: "Active",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01"
  },
  {
    id: "cust-03",
    customerName: "Sanjay Singhania",
    mobileNumber: "9123456789",
    address: "Bungalow 7, Golden Crest, Bandra Bandstand",
    city: "Mumbai",
    notes: "Regular event planner coordinator.",
    totalBookings: 0,
    currentDeposit: 0,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-sales-01",
    updatedBy: "user-sales-01"
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "BK-20260701-0001",
    customerId: "cust-01",
    customerName: "Rahul Deshmukh",
    customerMobile: "9820098200",
    bookingDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    rentalStartDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    returnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bookingStatus: BookingStatus.RETURNED,
    totalRent: 13000,
    securityDeposit: 10000,
    discount: 500,
    advanceAmount: 15000,
    remainingAmount: 0,
    invoiceNumber: "RF-INV-20260701-0001",
    invoiceType: "GST",
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "BK-20260705-0002",
    customerId: "cust-02",
    customerName: "Priyanka Patel",
    customerMobile: "9769976997",
    bookingDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    rentalStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    returnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bookingStatus: BookingStatus.DELIVERED,
    totalRent: 2500,
    securityDeposit: 8000,
    discount: 0,
    advanceAmount: 5000,
    remainingAmount: 5500,
    invoiceNumber: "RF-INV-20260705-0002",
    invoiceType: "Normal",
    createdBy: "user-sales-01",
    updatedBy: "user-sales-01",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "BK-20260708-0003",
    customerId: "cust-01",
    customerName: "Rahul Deshmukh",
    customerMobile: "9820098200",
    bookingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    rentalStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    returnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bookingStatus: BookingStatus.CONFIRMED,
    totalRent: 18500,
    securityDeposit: 15000,
    discount: 1000,
    advanceAmount: 10000,
    remainingAmount: 22500,
    invoiceNumber: "RF-INV-20260708-0003",
    invoiceType: "GST",
    createdBy: "user-admin-01",
    updatedBy: "user-admin-01",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_BOOKING_ITEMS: BookingItem[] = [
  {
    id: "bi-01",
    bookingId: "BK-20260701-0001",
    sku: "LEHN-002",
    itemName: "Sabyasachi-Inspired Crimson Bridal Lehenga",
    rentPrice: 12000,
    deposit: 10000,
    quantity: 1,
    totalRent: 12000,
    status: BookingStatus.RETURNED,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bi-02",
    bookingId: "BK-20260705-0002",
    sku: "CAM-SONY7M4",
    itemName: "Sony Alpha 7 IV Full-Frame Mirrorless Camera",
    rentPrice: 2500,
    deposit: 8000,
    quantity: 1,
    totalRent: 2500,
    status: BookingStatus.DELIVERED,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bi-03",
    bookingId: "BK-20260708-0003",
    sku: "SHRW-001",
    itemName: "Premium Royal Velvet Sherwani (Ivory Gold)",
    rentPrice: 6500,
    deposit: 5000,
    quantity: 1,
    totalRent: 6500,
    status: BookingStatus.CONFIRMED,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bi-04",
    bookingId: "BK-20260708-0003",
    sku: "LEHN-002",
    itemName: "Sabyasachi-Inspired Crimson Bridal Lehenga",
    rentPrice: 12000,
    deposit: 10000,
    quantity: 1,
    totalRent: 12000,
    status: BookingStatus.CONFIRMED,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_RETURNS: ReturnRecord[] = [
  {
    id: "RET-20260706-0001",
    bookingId: "BK-20260701-0001",
    customerId: "cust-01",
    customerName: "Rahul Deshmukh",
    returnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    returnedBy: "Amit Sharma",
    damageAmount: 0,
    depositRefund: 10000,
    remainingAmount: 0,
    returnStatus: ReturnStatus.COMPLETED,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        sku: "LEHN-002",
        itemName: "Sabyasachi-Inspired Crimson Bridal Lehenga",
        quantity: 1,
        condition: "Returned"
      }
    ]
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  { id: "log-01", userId: "user-admin-01", userName: "Amit Sharma", role: UserRole.ADMIN, action: "User Logged In", module: "Authentication", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), device: "MacBook Pro", browser: "Chrome" },
  { id: "log-02", userId: "user-admin-01", userName: "Amit Sharma", role: UserRole.ADMIN, action: "Created Inventory Item: SHRW-001", module: "Inventory", referenceId: "item-01", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), device: "MacBook Pro", browser: "Chrome" },
  { id: "log-03", userId: "user-sales-01", userName: "Rohit Verma", role: UserRole.SALES_PERSON, action: "Created Booking: BK-20260705-0002", module: "Bookings", referenceId: "BK-20260705-0002", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), device: "Windows Desktop", browser: "Edge" }
];

// Seeding engine to make sure Cloud Firestore is ready and populated
export const initializeFirestoreAndSeed = async () => {
  try {
    // 1. Settings
    const settingsRef = doc(db, "settings", "global");
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_SETTINGS);
    }

    // 2. License
    const licenseRef = doc(db, "license", "lic-prod-001");
    const licenseSnap = await getDoc(licenseRef);
    if (!licenseSnap.exists()) {
      await setDoc(licenseRef, DEFAULT_LICENSE);
    }

    // 3. Users
    const usersCol = collection(db, "users");
    const usersSnap = await getDocs(usersCol);
    if (usersSnap.empty) {
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, "users", u.id), u);
      }
    }

    // 4. Categories
    const catCol = collection(db, "categories");
    const catSnap = await getDocs(catCol);
    if (catSnap.empty) {
      for (const c of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, "categories", c.id), c);
      }
    }

    // 5. Items
    const itemsCol = collection(db, "items");
    const itemsSnap = await getDocs(itemsCol);
    if (itemsSnap.empty) {
      for (const i of DEFAULT_ITEMS) {
        await setDoc(doc(db, "items", i.id), i);
      }
    }

    // 6. Customers
    const custCol = collection(db, "customers");
    const custSnap = await getDocs(custCol);
    if (custSnap.empty) {
      for (const c of DEFAULT_CUSTOMERS) {
        await setDoc(doc(db, "customers", c.id), c);
      }
    }

    // 7. Bookings
    const bookingsCol = collection(db, "bookings");
    const bookingsSnap = await getDocs(bookingsCol);
    if (bookingsSnap.empty) {
      for (const b of DEFAULT_BOOKINGS) {
        await setDoc(doc(db, "bookings", b.id), b);
      }
    }

    // 8. Booking Items
    const bookingItemsCol = collection(db, "bookingItems");
    const bookingItemsSnap = await getDocs(bookingItemsCol);
    if (bookingItemsSnap.empty) {
      for (const bi of DEFAULT_BOOKING_ITEMS) {
        await setDoc(doc(db, "bookingItems", bi.id), bi);
      }
    }

    // 9. Returns
    const returnsCol = collection(db, "returns");
    const returnsSnap = await getDocs(returnsCol);
    if (returnsSnap.empty) {
      for (const r of DEFAULT_RETURNS) {
        await setDoc(doc(db, "returns", r.id), r);
      }
    }

    // 10. Logs
    const logsCol = collection(db, "logs");
    const logsSnap = await getDocs(logsCol);
    if (logsSnap.empty) {
      for (const l of DEFAULT_LOGS) {
        await setDoc(doc(db, "logs", l.id), l);
      }
    }
  } catch (err) {
    console.error("Firestore seeding background check failed:", err);
  }
};

// Trigger seeding dynamically in the background on service load
initializeFirestoreAndSeed();

// Unified Database API (Firebase Version)
export const dbService = {
  // Real-time Cloud Subscriptions
  subscribe(
    module: "items" | "bookings" | "customers" | "returns" | "categories" | "users" | "logs" | "settings" | "license",
    callback: (data: any) => void
  ) {
    if (module === "settings") {
      return onSnapshot(
        doc(db, "settings", "global"),
        (snap) => {
          if (snap.exists()) {
            callback({
              ...(snap.data() as CompanySettings),
              companyName: BRAND_CONFIG.companyName,
              companyLogo: BRAND_CONFIG.companyLogo,
              themeColor: BRAND_CONFIG.themeColor,
              phone: BRAND_CONFIG.phone,
              email: BRAND_CONFIG.email,
              whatsAppNumber: BRAND_CONFIG.whatsAppNumber,
              invoicePrefix: BRAND_CONFIG.invoicePrefix,
              businessAddress: BRAND_CONFIG.businessAddress,
              businessDescription: BRAND_CONFIG.businessDescription,
              city: BRAND_CONFIG.city,
              state: BRAND_CONFIG.state,
              country: BRAND_CONFIG.country,
              timezone: BRAND_CONFIG.timezone,
              currency: BRAND_CONFIG.currency,
              gstEnabled: BRAND_CONFIG.gstEnabled,
              gstNumber: BRAND_CONFIG.gstNumber,
            });
          } else {
            callback(DEFAULT_SETTINGS);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, "settings/global");
        }
      );
    }
    if (module === "license") {
      return onSnapshot(
        doc(db, "license", "lic-prod-001"),
        (snap) => {
          if (snap.exists()) {
            callback(snap.data());
          } else {
            callback(DEFAULT_LICENSE);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, "license/lic-prod-001");
        }
      );
    }

    // Standard Collections
    let q: any = collection(db, module);
    if (module === "logs") {
      q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    } else if (module === "bookings") {
      q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    } else if (module === "returns") {
      q = query(collection(db, "returns"), orderBy("createdAt", "desc"));
    }

    return onSnapshot(
      q,
      (snap) => {
        const items: any[] = [];
        snap.forEach((d) => {
          items.push({ ...d.data(), id: d.id });
        });
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, module);
      }
    );
  },

  // Log Activity to Cloud
  async logActivity(
    userId: string,
    userName: string,
    role: UserRole,
    action: string,
    module: string,
    referenceId?: string
  ) {
    const logId = "log-" + Date.now();
    const newLog: ActivityLog = {
      id: logId,
      userId,
      userName,
      role,
      action,
      module,
      referenceId: referenceId || "",
      timestamp: new Date().toISOString(),
      device: navigator.platform || "Web",
      browser: navigator.userAgent.split(" ").pop() || "Browser"
    };
    try {
      await setDoc(doc(db, "logs", logId), newLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "logs/" + logId);
    }
  },

  // AUTHENTICATION
  async login(email: string, password: string): Promise<{ user: AppUser; settings: CompanySettings; license: License }> {
    try {
      const snap = await getDocs(collection(db, "users"));
      const usersList: AppUser[] = [];
      snap.forEach((d) => {
        usersList.push({ ...(d.data() as AppUser), id: d.id });
      });

      const matchedUser = usersList.find((u: AppUser) => u.email.toLowerCase() === email.toLowerCase());

      if (!matchedUser) {
        throw new Error("Invalid email. No account associated with this email.");
      }

      if (password !== "admin123" && password !== "sales123" && password !== "manager123") {
        throw new Error("Incorrect password. Please try again.");
      }

      if (matchedUser.role === UserRole.ADMIN && password !== "admin123") {
        throw new Error("Incorrect password for Admin user.");
      }
      if (matchedUser.role === UserRole.MANAGER && password !== "manager123") {
        throw new Error("Incorrect password for Manager.");
      }
      if (matchedUser.role === UserRole.SALES_PERSON && password !== "sales123") {
        throw new Error("Incorrect password for Sales Person.");
      }

      if (matchedUser.status === UserStatus.DISABLED) {
        throw new Error("Your account has been disabled by the administrator.");
      }

      // Check current license & global settings from Firestore
      const licenseSnap = await getDoc(doc(db, "license", "lic-prod-001"));
      const license = licenseSnap.exists() ? (licenseSnap.data() as License) : DEFAULT_LICENSE;

      if (license.status === LicenseStatus.EXPIRED) {
        throw new Error("RentFlow license key has EXPIRED. Please contact administrator.");
      }
      if (license.status === LicenseStatus.DISABLED) {
        throw new Error("RentFlow license key has been DISABLED. Please contact support.");
      }

      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      const settings = settingsSnap.exists() ? (settingsSnap.data() as CompanySettings) : DEFAULT_SETTINGS;

      // Update operator's last login date/time
      matchedUser.lastLogin = new Date().toISOString();
      await setDoc(doc(db, "users", matchedUser.id), matchedUser);

      await this.logActivity(matchedUser.id, matchedUser.fullName, matchedUser.role, "User logged in", "Authentication");

      return {
        user: matchedUser,
        settings,
        license
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("{")) {
        throw err;
      }
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  },

  // USERS / STAFF
  async getUsers(): Promise<AppUser[]> {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: AppUser[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as AppUser), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "users");
      return [];
    }
  },

  async createUser(user: Omit<AppUser, "id" | "createdAt" | "updatedAt">): Promise<AppUser> {
    try {
      const existingUsers = await this.getUsers();
      const emailExists = existingUsers.some((u: AppUser) => u.email.toLowerCase() === user.email.toLowerCase());
      if (emailExists) throw new Error("Email already registered with another staff member.");

      const userId = "user-" + Date.now();
      const newUser: AppUser = {
        ...user,
        id: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", userId), newUser);
      return newUser;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already registered")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, "users");
      throw err;
    }
  },

  async updateUser(userId: string, updates: Partial<AppUser>): Promise<AppUser> {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error("User not found.");

      const updated = {
        ...(snap.data() as AppUser),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users/" + userId);
      throw err;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "users/" + userId);
    }
  },

  // SETTINGS
  async getSettings(): Promise<CompanySettings> {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      let baseSettings = DEFAULT_SETTINGS;
      if (snap.exists()) {
        baseSettings = snap.data() as CompanySettings;
      }
      return {
        ...baseSettings,
        companyName: BRAND_CONFIG.companyName,
        companyLogo: BRAND_CONFIG.companyLogo,
        themeColor: BRAND_CONFIG.themeColor,
        phone: BRAND_CONFIG.phone,
        email: BRAND_CONFIG.email,
        whatsAppNumber: BRAND_CONFIG.whatsAppNumber,
        invoicePrefix: BRAND_CONFIG.invoicePrefix,
        businessAddress: BRAND_CONFIG.businessAddress,
        businessDescription: BRAND_CONFIG.businessDescription,
        city: BRAND_CONFIG.city,
        state: BRAND_CONFIG.state,
        country: BRAND_CONFIG.country,
        timezone: BRAND_CONFIG.timezone,
        currency: BRAND_CONFIG.currency,
        gstEnabled: BRAND_CONFIG.gstEnabled,
        gstNumber: BRAND_CONFIG.gstNumber,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "settings/global");
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    try {
      const current = await this.getSettings();
      // Keep brand config values strictly unchangeable from settings updates
      const {
        companyName,
        companyLogo,
        themeColor,
        phone,
        email,
        whatsAppNumber,
        invoicePrefix,
        businessAddress,
        businessDescription,
        city,
        state,
        country,
        timezone,
        currency,
        gstEnabled,
        gstNumber,
        ...allowedUpdates
      } = updates;

      const updated = {
        ...current,
        ...allowedUpdates,
        companyName: BRAND_CONFIG.companyName,
        companyLogo: BRAND_CONFIG.companyLogo,
        themeColor: BRAND_CONFIG.themeColor,
        phone: BRAND_CONFIG.phone,
        email: BRAND_CONFIG.email,
        whatsAppNumber: BRAND_CONFIG.whatsAppNumber,
        invoicePrefix: BRAND_CONFIG.invoicePrefix,
        businessAddress: BRAND_CONFIG.businessAddress,
        businessDescription: BRAND_CONFIG.businessDescription,
        city: BRAND_CONFIG.city,
        state: BRAND_CONFIG.state,
        country: BRAND_CONFIG.country,
        timezone: BRAND_CONFIG.timezone,
        currency: BRAND_CONFIG.currency,
        gstEnabled: BRAND_CONFIG.gstEnabled,
        gstNumber: BRAND_CONFIG.gstNumber,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "settings", "global"), updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/global");
      throw err;
    }
  },

  // LICENSE
  async getLicense(): Promise<License> {
    try {
      const snap = await getDoc(doc(db, "license", "lic-prod-001"));
      if (snap.exists()) {
        return snap.data() as License;
      }
      return DEFAULT_LICENSE;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "license/lic-prod-001");
      return DEFAULT_LICENSE;
    }
  },

  async updateLicense(updates: Partial<License>): Promise<License> {
    try {
      const current = await this.getLicense();
      const updated = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "license", "lic-prod-001"), updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "license/lic-prod-001");
      throw err;
    }
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, "categories"));
      const list: Category[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Category), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "categories");
      return [];
    }
  },

  async createCategory(cat: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    try {
      const categories = await this.getCategories();
      const exists = categories.some((c: Category) => c.categoryName.toLowerCase() === cat.categoryName.toLowerCase());
      if (exists) throw new Error("Category name already exists.");

      const catId = "cat-" + Date.now();
      const newCat: Category = {
        ...cat,
        id: catId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "categories", catId), newCat);
      return newCat;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, "categories");
      throw err;
    }
  },

  async updateCategory(catId: string, updates: Partial<Category>): Promise<Category> {
    try {
      const catRef = doc(db, "categories", catId);
      const snap = await getDoc(catRef);
      if (!snap.exists()) throw new Error("Category not found.");

      const updated = {
        ...(snap.data() as Category),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await setDoc(catRef, updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "categories/" + catId);
      throw err;
    }
  },

  async deleteCategory(catId: string): Promise<void> {
    try {
      const items = await this.getItems();
      const hasItems = items.some((item: InventoryItem) => item.categoryId === catId);
      if (hasItems) {
        throw new Error("Cannot delete category containing active inventory items. Please relocate items first.");
      }
      await deleteDoc(doc(db, "categories", catId));
    } catch (err) {
      if (err instanceof Error && err.message.includes("Cannot delete category")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.DELETE, "categories/" + catId);
      throw err;
    }
  },

  // INVENTORY ITEMS
  async getItems(): Promise<InventoryItem[]> {
    try {
      const snap = await getDocs(collection(db, "items"));
      const list: InventoryItem[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as InventoryItem), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "items");
      return [];
    }
  },

  async createItem(
    item: Omit<
      InventoryItem,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "availableQuantity"
      | "bookedQuantity"
      | "outQuantity"
      | "maintenanceQuantity"
      | "lostQuantity"
    >
  ): Promise<InventoryItem> {
    try {
      const items = await this.getItems();
      const skuExists = items.some((i: InventoryItem) => i.sku.toUpperCase() === item.sku.toUpperCase());
      if (skuExists) throw new Error(`SKU Code "${item.sku}" already exists. SKU must be globally unique.`);

      const itemId = "item-" + Date.now();
      const newItem: InventoryItem = {
        ...item,
        sku: item.sku.toUpperCase(),
        id: itemId,
        availableQuantity: item.quantity,
        bookedQuantity: 0,
        outQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "items", itemId), newItem);
      return newItem;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, "items");
      throw err;
    }
  },

  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const items = await this.getItems();
      const idx = items.findIndex((i: InventoryItem) => i.id === itemId);
      if (idx === -1) throw new Error("Item not found.");

      const currentItem = items[idx];
      if (updates.sku && updates.sku.toUpperCase() !== currentItem.sku) {
        const skuExists = items.some((i: InventoryItem) => i.sku.toUpperCase() === updates.sku?.toUpperCase());
        if (skuExists) throw new Error(`SKU Code "${updates.sku}" is already in use by another item.`);
      }

      const mergedBooked = Number(updates.bookedQuantity !== undefined ? updates.bookedQuantity : currentItem.bookedQuantity) || 0;
      const mergedOut = Number(updates.outQuantity !== undefined ? updates.outQuantity : currentItem.outQuantity) || 0;
      const mergedMaint = Number(updates.maintenanceQuantity !== undefined ? updates.maintenanceQuantity : currentItem.maintenanceQuantity) || 0;
      const mergedLost = Number(updates.lostQuantity !== undefined ? updates.lostQuantity : currentItem.lostQuantity) || 0;
      const newQty = Number(updates.quantity !== undefined ? updates.quantity : currentItem.quantity) || 0;

      const activeCommitted = mergedBooked + mergedOut + mergedMaint + mergedLost;
      if (newQty < activeCommitted) {
        throw new Error(`Cannot reduce total quantity below active commitments (${activeCommitted} items are currently booked/out/in-maintenance).`);
      }

      // Automatically determine status if not explicitly passed
      let targetStatus = updates.status || currentItem.status;
      const availableQuantity = newQty - activeCommitted;
      if (updates.status === undefined) {
        if (availableQuantity <= 0) {
          if (mergedOut > 0) targetStatus = ItemStatus.OUT;
          else if (mergedBooked > 0) targetStatus = ItemStatus.BOOKED;
          else if (mergedMaint > 0) targetStatus = ItemStatus.MAINTENANCE;
          else if (mergedLost > 0) targetStatus = ItemStatus.LOST;
        } else {
          targetStatus = ItemStatus.AVAILABLE;
        }
      }

      const updatedItem: InventoryItem = {
        ...currentItem,
        ...updates,
        sku: updates.sku ? updates.sku.toUpperCase() : currentItem.sku,
        quantity: newQty,
        bookedQuantity: mergedBooked,
        outQuantity: mergedOut,
        maintenanceQuantity: mergedMaint,
        lostQuantity: mergedLost,
        availableQuantity,
        status: targetStatus,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "items", itemId), updatedItem);
      return updatedItem;
    } catch (err) {
      if (err instanceof Error && (err.message.includes("already in use") || err.message.includes("Cannot reduce total quantity"))) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, "items/" + itemId);
      throw err;
    }
  },

  async archiveItem(itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, "items", itemId);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) throw new Error("Item not found.");

      const item = snap.data() as InventoryItem;
      const committed = item.bookedQuantity + item.outQuantity;
      if (committed > 0) {
        throw new Error(`Cannot delete or archive item. There are ${committed} active bookings/rentals for this item.`);
      }

      await deleteDoc(itemRef);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Cannot delete or archive")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.DELETE, "items/" + itemId);
      throw err;
    }
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    try {
      const snap = await getDocs(collection(db, "customers"));
      const list: Customer[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Customer), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "customers");
      return [];
    }
  },

  async createCustomer(
    cust: Omit<Customer, "id" | "createdAt" | "updatedAt" | "totalBookings" | "currentDeposit">
  ): Promise<Customer> {
    try {
      const customers = await this.getCustomers();
      const mobileExists = customers.some((c: Customer) => c.mobileNumber === cust.mobileNumber);
      if (mobileExists) throw new Error(`Customer with mobile number ${cust.mobileNumber} is already registered.`);

      const custId = "cust-" + Date.now();
      const newCust: Customer = {
        ...cust,
        id: custId,
        totalBookings: 0,
        currentDeposit: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "customers", custId), newCust);
      return newCust;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already registered")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, "customers");
      throw err;
    }
  },

  async updateCustomer(custId: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const customers = await this.getCustomers();
      const idx = customers.findIndex((c: Customer) => c.id === custId);
      if (idx === -1) throw new Error("Customer not found.");

      if (updates.mobileNumber && updates.mobileNumber !== customers[idx].mobileNumber) {
        const mobileExists = customers.some((c: Customer) => c.mobileNumber === updates.mobileNumber);
        if (mobileExists) throw new Error(`Another customer is already registered with mobile number ${updates.mobileNumber}.`);
      }

      const updated = {
        ...customers[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "customers", custId), updated);
      return updated;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Another customer is already registered")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, "customers/" + custId);
      throw err;
    }
  },

  async deleteCustomer(custId: string): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const hasHistory = bookings.some((b: Booking) => b.customerId === custId);
      if (hasHistory) {
        throw new Error("Cannot delete customer because booking records exist under their name. Historical integrity must be preserved.");
      }
      await deleteDoc(doc(db, "customers", custId));
    } catch (err) {
      if (err instanceof Error && err.message.includes("Cannot delete customer")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.DELETE, "customers/" + custId);
      throw err;
    }
  },

  // BOOKINGS & AVAILABILITY ENGINE
  async getBookings(): Promise<Booking[]> {
    try {
      const snap = await getDocs(collection(db, "bookings"));
      const list: Booking[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Booking), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "bookings");
      return [];
    }
  },

  async getBookingItems(bookingId: string): Promise<BookingItem[]> {
    try {
      const snap = await getDocs(collection(db, "bookingItems"));
      const list: BookingItem[] = [];
      snap.forEach((d) => {
        const bi = d.data() as BookingItem;
        if (bi.bookingId === bookingId) {
          list.push({ ...bi, id: d.id });
        }
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "bookingItems");
      return [];
    }
  },

  // Check Item Availability dynamically across active overlapping rental dates
  async checkAvailability(
    sku: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<{
    total: number;
    committed: number;
    available: number;
  }> {
    try {
      const items = await this.getItems();
      const item = items.find((i: InventoryItem) => i.sku === sku);
      if (!item) throw new Error(`Item with SKU "${sku}" does not exist.`);

      const totalQty = item.quantity;
      const reqStart = new Date(startDateStr).getTime();
      const reqEnd = new Date(endDateStr).getTime();

      const bookings = await this.getBookings();
      const activeBookings = bookings.filter((b: Booking) =>
        b.bookingStatus !== BookingStatus.CANCELLED &&
        b.bookingStatus !== BookingStatus.RETURNED &&
        b.bookingStatus !== BookingStatus.DRAFT
      );

      let committedQty = 0;

      // Get booking items for those active bookings
      const bookingItemsSnap = await getDocs(collection(db, "bookingItems"));
      const allBookingItems: BookingItem[] = [];
      bookingItemsSnap.forEach((d) => {
        allBookingItems.push(d.data() as BookingItem);
      });

      activeBookings.forEach((b: Booking) => {
        const bStart = new Date(b.rentalStartDate).getTime();
        const bEnd = new Date(b.returnDate).getTime();

        const isOverlap = bStart <= reqEnd && bEnd >= reqStart;
        if (isOverlap) {
          const itemsInBooking = allBookingItems.filter((bi: BookingItem) => bi.bookingId === b.id && bi.sku === sku);
          itemsInBooking.forEach((bi: BookingItem) => {
            committedQty += bi.quantity;
          });
        }
      });

      const physicalDeduction = item.maintenanceQuantity + item.lostQuantity;
      const available = Math.max(0, totalQty - (committedQty + physicalDeduction));

      return {
        total: totalQty,
        committed: committedQty + physicalDeduction,
        available
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("does not exist")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, "items");
      throw err;
    }
  },

  async createBooking(
    bookingData: Omit<Booking, "id" | "invoiceNumber" | "createdAt" | "updatedAt">,
    selectedItems: { sku: string; quantity: number }[]
  ): Promise<Booking> {
    try {
      const items = await this.getItems();

      // 1. Double check and validate availability for EVERY item first
      for (const entry of selectedItems) {
        const item = items.find((i: InventoryItem) => i.sku === entry.sku);
        if (!item) throw new Error(`SKU Code "${entry.sku}" is invalid.`);

        const { available } = await this.checkAvailability(entry.sku, bookingData.rentalStartDate, bookingData.returnDate);
        if (entry.quantity > available) {
          throw new Error(`Overbooking Prevented: Only ${available} units of "${item.itemName}" (${entry.sku}) are available for the selected dates.`);
        }
      }

      // 2. Generate Booking ID and Invoice Number
      const bookings = await this.getBookings();
      const datePrefix = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const dailyCount = bookings.filter((b: Booking) => b.id.includes(datePrefix)).length + 1;
      const serialStr = String(dailyCount).padStart(4, "0");

      const bookingId = `BK-${datePrefix}-${serialStr}`;
      const settings = await this.getSettings();
      const invoiceNumber = `${settings.invoicePrefix || "RF-INV"}-${datePrefix}-${serialStr}`;

      const newBooking: Booking = {
        ...bookingData,
        id: bookingId,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. Create Booking Items records and update item balances
      const batch = writeBatch(db);

      // Save Booking doc
      batch.set(doc(db, "bookings", bookingId), newBooking);

      for (const entry of selectedItems) {
        const item = items.find((i: InventoryItem) => i.sku === entry.sku)!;
        const biId = "bi-" + Math.random().toString(36).substr(2, 9);
        const bi: BookingItem = {
          id: biId,
          bookingId,
          sku: entry.sku,
          itemName: item.itemName,
          rentPrice: item.rentPrice,
          deposit: item.securityDeposit,
          quantity: entry.quantity,
          totalRent: item.rentPrice * entry.quantity,
          status: bookingData.bookingStatus,
          createdAt: new Date().toISOString()
        };

        batch.set(doc(db, "bookingItems", biId), bi);

        // Normalize quantities to avoid any undefined/NaN issues
        item.bookedQuantity = Number(item.bookedQuantity) || 0;
        item.outQuantity = Number(item.outQuantity) || 0;
        item.maintenanceQuantity = Number(item.maintenanceQuantity) || 0;
        item.lostQuantity = Number(item.lostQuantity) || 0;
        item.quantity = Number(item.quantity) || 0;

        // Adjust Item physical balances instantly if confirmed/delivered
        if (bookingData.bookingStatus === BookingStatus.CONFIRMED) {
          item.bookedQuantity += entry.quantity;
        } else if (bookingData.bookingStatus === BookingStatus.DELIVERED) {
          item.outQuantity += entry.quantity;
        }
        item.availableQuantity = item.quantity - (item.bookedQuantity + item.outQuantity + item.maintenanceQuantity + item.lostQuantity);
        
        // Auto update status
        if (item.availableQuantity <= 0) {
          if (item.outQuantity > 0) item.status = ItemStatus.OUT;
          else if (item.bookedQuantity > 0) item.status = ItemStatus.BOOKED;
          else if (item.maintenanceQuantity > 0) item.status = ItemStatus.MAINTENANCE;
          else if (item.lostQuantity > 0) item.status = ItemStatus.LOST;
        } else {
          item.status = ItemStatus.AVAILABLE;
        }

        item.updatedAt = new Date().toISOString();

        batch.set(doc(db, "items", item.id), item);
      }

      // 4. Update Customer Summary
      const customers = await this.getCustomers();
      const customer = customers.find((c: Customer) => c.id === bookingData.customerId);
      if (customer) {
        customer.totalBookings += 1;
        customer.currentDeposit += bookingData.securityDeposit;
        customer.updatedAt = new Date().toISOString();
        batch.set(doc(db, "customers", customer.id), customer);
      }

      // Commit all writes at once
      await batch.commit();

      await this.logActivity(bookingData.createdBy, "Staff Member", UserRole.ADMIN, `Created Booking ${bookingId} for Customer ${bookingData.customerName}`, "Bookings", bookingId);

      return newBooking;
    } catch (err) {
      if (err instanceof Error && (err.message.includes("is invalid") || err.message.includes("Overbooking Prevented"))) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, "bookings");
      throw err;
    }
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    userId: string,
    paymentUpdate?: { advanceAmount: number; remainingAmount: number }
  ): Promise<Booking> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found.");

      const booking = bookingSnap.data() as Booking;
      const oldStatus = booking.bookingStatus;
      if (oldStatus === newStatus && !paymentUpdate) return booking;

      const bItems = await this.getBookingItems(bookingId);
      const items = await this.getItems();

      const batch = writeBatch(db);

      // Rollback item balances based on old status
      bItems.forEach((bi: BookingItem) => {
        const item = items.find((i: InventoryItem) => i.sku === bi.sku);
        if (item) {
          // Normalize quantities to avoid any undefined/NaN issues
          item.bookedQuantity = Number(item.bookedQuantity) || 0;
          item.outQuantity = Number(item.outQuantity) || 0;
          item.maintenanceQuantity = Number(item.maintenanceQuantity) || 0;
          item.lostQuantity = Number(item.lostQuantity) || 0;
          item.quantity = Number(item.quantity) || 0;

          if (oldStatus === BookingStatus.CONFIRMED) item.bookedQuantity -= bi.quantity;
          else if (oldStatus === BookingStatus.DELIVERED) item.outQuantity -= bi.quantity;
          item.availableQuantity = item.quantity - (item.bookedQuantity + item.outQuantity + item.maintenanceQuantity + item.lostQuantity);
          
          // Auto update status
          if (item.availableQuantity <= 0) {
            if (item.outQuantity > 0) item.status = ItemStatus.OUT;
            else if (item.bookedQuantity > 0) item.status = ItemStatus.BOOKED;
            else if (item.maintenanceQuantity > 0) item.status = ItemStatus.MAINTENANCE;
            else if (item.lostQuantity > 0) item.status = ItemStatus.LOST;
          } else {
            item.status = ItemStatus.AVAILABLE;
          }

          item.updatedAt = new Date().toISOString();
          batch.set(doc(db, "items", item.id), item);
        }
      });

      // Apply balances for new status
      bItems.forEach((bi: BookingItem) => {
        const item = items.find((i: InventoryItem) => i.sku === bi.sku);
        if (item) {
          // Normalize quantities to avoid any undefined/NaN issues
          item.bookedQuantity = Number(item.bookedQuantity) || 0;
          item.outQuantity = Number(item.outQuantity) || 0;
          item.maintenanceQuantity = Number(item.maintenanceQuantity) || 0;
          item.lostQuantity = Number(item.lostQuantity) || 0;
          item.quantity = Number(item.quantity) || 0;

          if (newStatus === BookingStatus.CONFIRMED) item.bookedQuantity += bi.quantity;
          else if (newStatus === BookingStatus.DELIVERED) item.outQuantity += bi.quantity;
          item.availableQuantity = item.quantity - (item.bookedQuantity + item.outQuantity + item.maintenanceQuantity + item.lostQuantity);
          
          // Auto update status
          if (item.availableQuantity <= 0) {
            if (item.outQuantity > 0) item.status = ItemStatus.OUT;
            else if (item.bookedQuantity > 0) item.status = ItemStatus.BOOKED;
            else if (item.maintenanceQuantity > 0) item.status = ItemStatus.MAINTENANCE;
            else if (item.lostQuantity > 0) item.status = ItemStatus.LOST;
          } else {
            item.status = ItemStatus.AVAILABLE;
          }

          item.updatedAt = new Date().toISOString();
          batch.set(doc(db, "items", item.id), item);

          bi.status = newStatus;
          batch.set(doc(db, "bookingItems", bi.id), bi);
        }
      });

      // Update customer deposits on cancellation
      if (newStatus === BookingStatus.CANCELLED) {
        const customers = await this.getCustomers();
        const customer = customers.find((c: Customer) => c.id === booking.customerId);
        if (customer) {
          customer.currentDeposit = Math.max(0, customer.currentDeposit - booking.securityDeposit);
          customer.updatedAt = new Date().toISOString();
          batch.set(doc(db, "customers", customer.id), customer);
        }
      }

      if (paymentUpdate) {
        booking.advanceAmount = paymentUpdate.advanceAmount;
        booking.remainingAmount = paymentUpdate.remainingAmount;
      }

      booking.bookingStatus = newStatus;
      booking.updatedBy = userId;
      booking.updatedAt = new Date().toISOString();
      batch.set(bookingRef, booking);

      await batch.commit();

      await this.logActivity(userId, "Staff Member", UserRole.ADMIN, `Updated Booking ${bookingId} Status to ${newStatus}`, "Bookings", bookingId);

      return booking;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Booking not found")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, "bookings/" + bookingId);
      throw err;
    }
  },

  // RETURN MANAGEMENT
  async getReturns(): Promise<ReturnRecord[]> {
    try {
      const snap = await getDocs(collection(db, "returns"));
      const list: ReturnRecord[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as ReturnRecord), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "returns");
      return [];
    }
  },

  async processReturn(returnObj: Omit<ReturnRecord, "id" | "createdAt">, userId: string): Promise<ReturnRecord> {
    try {
      const returns = await this.getReturns();
      const datePrefix = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const dailyCount = returns.filter((r: ReturnRecord) => r.id.includes(datePrefix)).length + 1;
      const returnId = `RET-${datePrefix}-${String(dailyCount).padStart(4, "0")}`;

      const newReturn: ReturnRecord = {
        ...returnObj,
        id: returnId,
        createdAt: new Date().toISOString()
      };

      const bookingRef = doc(db, "bookings", returnObj.bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) throw new Error("Reference booking not found.");

      const booking = bookingSnap.data() as Booking;
      booking.bookingStatus = BookingStatus.RETURNED;
      booking.remainingAmount = returnObj.remainingAmount;
      booking.updatedAt = new Date().toISOString();
      booking.updatedBy = userId;

      const items = await this.getItems();
      const bItems = await this.getBookingItems(returnObj.bookingId);

      const batch = writeBatch(db);

      // Process return record
      batch.set(doc(db, "returns", returnId), newReturn);
      batch.set(bookingRef, booking);

      returnObj.items.forEach((retItem) => {
        const item = items.find((i: InventoryItem) => i.sku === retItem.sku);
        if (item) {
          // Normalize quantities to avoid any undefined/NaN issues
          item.bookedQuantity = Number(item.bookedQuantity) || 0;
          item.outQuantity = Number(item.outQuantity) || 0;
          item.maintenanceQuantity = Number(item.maintenanceQuantity) || 0;
          item.lostQuantity = Number(item.lostQuantity) || 0;
          item.quantity = Number(item.quantity) || 0;

          const retQty = Number(retItem.quantity) || 0;
          // Decrease outQuantity since item is returned from hands of customer
          item.outQuantity = Math.max(0, item.outQuantity - retQty);

          if (retItem.condition === "Returned") {
            // Normal flow
          } else if (retItem.condition === "Damaged") {
            item.maintenanceQuantity += retQty;
          } else if (retItem.condition === "Missing") {
            item.lostQuantity += retQty;
          }

          item.availableQuantity = item.quantity - (item.bookedQuantity + item.outQuantity + item.maintenanceQuantity + item.lostQuantity);
          
          // Auto update status
          if (item.availableQuantity <= 0) {
            if (item.outQuantity > 0) item.status = ItemStatus.OUT;
            else if (item.bookedQuantity > 0) item.status = ItemStatus.BOOKED;
            else if (item.maintenanceQuantity > 0) item.status = ItemStatus.MAINTENANCE;
            else if (item.lostQuantity > 0) item.status = ItemStatus.LOST;
          } else {
            item.status = ItemStatus.AVAILABLE;
          }

          item.updatedAt = new Date().toISOString();
          batch.set(doc(db, "items", item.id), item);
        }

        const bi = bItems.find((b) => b.bookingId === returnObj.bookingId && b.sku === retItem.sku);
        if (bi) {
          bi.status = BookingStatus.RETURNED;
          batch.set(doc(db, "bookingItems", bi.id), bi);
        }
      });

      const customers = await this.getCustomers();
      const customer = customers.find((c: Customer) => c.id === returnObj.customerId);
      if (customer) {
        customer.currentDeposit = Math.max(0, customer.currentDeposit - booking.securityDeposit);
        customer.updatedAt = new Date().toISOString();
        batch.set(doc(db, "customers", customer.id), customer);
      }

      await batch.commit();

      await this.logActivity(userId, "Staff Member", UserRole.ADMIN, `Processed Return ${returnId} for Booking ${returnObj.bookingId}`, "Returns", returnId);

      return newReturn;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Reference booking not found")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, "returns");
      throw err;
    }
  }
};
