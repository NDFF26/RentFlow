/**
 * Developer Configuration File for Branding & Company Details
 * Edit this file directly in the code editor to update the brand details.
 * The Admin settings panel will display these details but prevent modification, as requested.
 */

export interface BrandConfig {
  companyName: string;
  companyLogo: string;
  themeColor: string; // e.g., "blue", "rose", "emerald", "violet"
  phone: string;
  email: string;
  whatsAppNumber: string;
  invoicePrefix: string;
  currency: string;
  gstEnabled: boolean;
  gstNumber: string;
  businessAddress: string;
  businessDescription: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
}

export const BRAND_CONFIG: BrandConfig = {
  companyName: "Royal Heritage Marriage Wear Rentals",
  companyLogo: `${import.meta.env.BASE_URL || "/"}logo.png`,
  themeColor: "rose", // Premium rose/maroon elegant tone for marriage cloth rental
  phone: "+91 98765 43210",
  email: "contact@royalheritagerentals.com",
  whatsAppNumber: "919876543210",
  invoicePrefix: "RHM-INV",
  currency: "₹",
  gstEnabled: true,
  gstNumber: "27AAAAA1111A1Z1",
  businessAddress: "Showroom 12, Heritage Arcade, Opp. Taj Palace, Colaba, Mumbai, MH - 400001",
  businessDescription: "Exclusive designer bridal lehengas, royal sherwanis, premium wedding gowns, and traditional luxury accessories on rental.",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  timezone: "Asia/Kolkata"
};
