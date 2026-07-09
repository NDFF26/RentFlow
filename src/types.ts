/**
 * RentFlow Types & Interfaces
 * Version 1.0.0
 * Strictly mapping to database schemas specified in RentFlow Master Documentation (Part 2)
 */

export enum UserRole {
  ADMIN = "Admin",
  MANAGER = "Manager",
  SALES_PERSON = "Sales Person"
}

export enum UserStatus {
  ACTIVE = "Active",
  DISABLED = "Disabled"
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  companyLogo: string;
  themeColor: string; // e.g. "blue"
  phone: string;
  email: string;
  whatsAppNumber: string;
  invoicePrefix: string;
  currency: string; // "₹"
  gstEnabled: boolean;
  gstNumber?: string;
  depositEnabled: boolean;
  softwareVersion: string;
  timezone: string;
  country: string;
  state: string;
  city: string;
  businessAddress: string;
  businessDescription: string;
  createdAt: string;
  updatedAt: string;
}

export enum LicenseStatus {
  TRIAL = "Trial",
  ACTIVE = "Active",
  EXPIRED = "Expired",
  DISABLED = "Disabled"
}

export interface License {
  id: string;
  licenseKey: string;
  status: LicenseStatus;
  activationDate: string;
  expiryDate: string;
  maximumUsers: number;
  registeredEmail: string;
  currentVersion: string;
  lastVerification: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  categoryName: string;
  description: string;
  status: "Active" | "Disabled";
  createdAt: string;
  updatedAt: string;
}

export enum ItemStatus {
  AVAILABLE = "Available",
  BOOKED = "Booked",
  OUT = "Out",
  MAINTENANCE = "Maintenance",
  LOST = "Lost"
}

export interface InventoryItem {
  id: string; // Document ID
  sku: string; // E.g., SHRW-001 (Unique)
  itemName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  rentPrice: number;
  securityDeposit: number;
  quantity: number; // Total quantity owned
  availableQuantity: number;
  bookedQuantity: number;
  outQuantity: number;
  maintenanceQuantity: number;
  lostQuantity: number;
  imageUrl: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobileNumber: string;
  alternateMobile?: string;
  address: string;
  city: string;
  notes?: string;
  totalBookings: number;
  currentDeposit: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export enum BookingStatus {
  DRAFT = "Draft",
  CONFIRMED = "Confirmed",
  DELIVERED = "Delivered",
  RETURNED = "Returned",
  CANCELLED = "Cancelled"
}

export interface Booking {
  id: string; // Booking ID: BK-YYYYMMDD-XXXX
  customerId: string;
  customerName: string;
  customerMobile: string;
  bookingDate: string;
  rentalStartDate: string;
  returnDate: string;
  bookingStatus: BookingStatus;
  totalRent: number;
  securityDeposit: number;
  discount: number;
  advanceAmount: number;
  remainingAmount: number;
  invoiceNumber: string; // INV-YYYYMMDD-XXXX
  invoiceType: "Normal" | "GST";
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingItem {
  id: string;
  bookingId: string;
  sku: string;
  itemName: string;
  rentPrice: number;
  deposit: number;
  quantity: number;
  totalRent: number;
  status: BookingStatus;
  createdAt: string;
}

export enum ReturnStatus {
  COMPLETED = "Completed",
  PENDING = "Pending"
}

export interface ReturnRecord {
  id: string; // Return ID
  bookingId: string;
  customerId: string;
  customerName: string;
  returnDate: string;
  returnedBy: string; // User ID/Name
  damageAmount: number;
  depositRefund: number;
  remainingAmount: number;
  returnStatus: ReturnStatus;
  createdAt: string;
  items: {
    sku: string;
    itemName: string;
    quantity: number;
    condition: "Returned" | "Damaged" | "Missing";
  }[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string; // e.g. "Login", "Booking Created"
  module: string; // e.g. "Authentication", "Bookings"
  referenceId?: string;
  timestamp: string;
  device: string;
  browser: string;
}
