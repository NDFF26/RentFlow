/**
 * RentFlow Analytics & Performance Reports Component
 * Provides financial audit boards, stock occupancy charts,
 * and XLSX exports for inventory rosters and sales bookings.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { FileDown, BarChart3, TrendingUp, ShieldAlert, FileSpreadsheet, Layers, PieChart, Coins } from "lucide-react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

export const Reports: React.FC = () => {
  const { bookings, items, customers, currentUser } = useApp();
  const [exportingType, setExportingType] = useState<string | null>(null);

  // FINANCIAL PERFORMANCE METRICS
  const totalTariffCollected = bookings
    .filter((b) => b.bookingStatus !== "Cancelled")
    .reduce((sum, b) => sum + b.totalRent - b.discount, 0);

  const totalAdvanceHeld = bookings
    .filter((b) => b.bookingStatus !== "Cancelled")
    .reduce((sum, b) => sum + b.advanceAmount, 0);

  const totalPendingCollection = bookings
    .filter((b) => b.bookingStatus === "Delivered")
    .reduce((sum, b) => sum + b.remainingAmount, 0);

  // ITEM COUNTS
  const totalSkusCount = items.length;
  const totalStockUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const outOnRentUnits = items.reduce((sum, i) => sum + i.outQuantity, 0);
  const inMaintenanceUnits = items.reduce((sum, i) => sum + i.maintenanceQuantity, 0);
  const lostUnits = items.reduce((sum, i) => sum + i.lostQuantity, 0);
  const availableUnits = totalStockUnits - outOnRentUnits - inMaintenanceUnits - lostUnits;

  // STOCK OCCUPANCY RATIO
  const occupancyPercentage = totalStockUnits > 0 ? Math.round((outOnRentUnits / totalStockUnits) * 100) : 0;

  // EXCEL SHEET EXPORT LOGIC
  const triggerExcelExport = (type: "inventory" | "bookings" | "customers") => {
    setExportingType(type);
    try {
      let dataToExport: any[] = [];
      let filename = `RentFlow_Export_${type}_${dayjs().format("YYYY-MM-DD")}.xlsx`;

      if (type === "inventory") {
        dataToExport = items.map((i) => ({
          SKU: i.sku,
          "Item Name": i.itemName,
          Category: i.categoryName,
          "Rent Price (₹)": i.rentPrice,
          "Security Deposit (₹)": i.securityDeposit,
          "Total Stock Units": i.quantity,
          "Out On Rent": i.outQuantity,
          "In Maintenance": i.maintenanceQuantity,
          "Lost/Damaged Units": i.lostQuantity,
          "Available Stock": i.availableQuantity
        }));
      } else if (type === "bookings") {
        dataToExport = bookings.map((b) => ({
          "Booking ID": b.id,
          "Invoice No": b.invoiceNumber,
          "Customer Name": b.customerName,
          "Customer Mobile": b.customerMobile,
          "Rental Start": b.rentalStartDate,
          "Scheduled Return": b.returnDate,
          "Total Rent Price (₹)": b.totalRent,
          "Security Deposit Held (₹)": b.securityDeposit,
          "Discount (₹)": b.discount,
          "Advance Paid (₹)": b.advanceAmount,
          "Outstanding Balance (₹)": b.remainingAmount,
          "Booking Status": b.bookingStatus,
          "Date Booked": dayjs(b.bookingDate).format("DD-MMM-YYYY hh:mm A")
        }));
      } else if (type === "customers") {
        dataToExport = customers.map((c) => ({
          "Customer ID": c.id,
          "Customer Name": c.customerName,
          "Mobile Number": c.mobileNumber,
          "Alternate Mobile": c.alternateMobile || "N/A",
          City: c.city,
          Address: c.address,
          "Active Held Deposit (₹)": c.currentDeposit,
          "Total Rentals Logged": c.totalBookings,
          "Account Status": c.status
        }));
      }

      // Generate workbook
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${type} Data`);
      
      // Auto-fit columns
      const maxColWidths = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, colIdx) => {
          const val = String(row[key] || "");
          acc[colIdx] = Math.max(acc[colIdx] || 10, val.length + 3);
        });
        return acc;
      }, []);
      worksheet["!cols"] = maxColWidths.map((w: number) => ({ wth: w }));

      XLSX.writeFile(workbook, filename);
      
      if (currentUser) {
        dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Exported Excel sheet for ${type}`, "Reports", type);
      }
      toast.success(`Excel Sheet exported successfully: ${filename}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to compile Excel sheet.");
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight flex items-center">
            <BarChart3 className="w-5.5 h-5.5 text-primary-600 mr-2" />
            Performance Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit store ledger sheets, review real-time occupancy metrics, track asset states, and compile Excel sheets.
          </p>
        </div>
      </div>

      {/* THREE VALUE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 01 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Gross Rental Revenue (Uncancelled)</span>
            <span className="text-2xl font-display font-black text-slate-900 tracking-tight block mt-1">₹{totalTariffCollected.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Aggregating multiple order files</span>
          </div>
        </div>

        {/* Card 02 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Advance Tariffs Received</span>
            <span className="text-2xl font-display font-black text-slate-900 tracking-tight block mt-1">₹{totalAdvanceHeld.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Committed cash balance on logs</span>
          </div>
        </div>

        {/* Card 03 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Outstanding Balance Collection</span>
            <span className="text-2xl font-display font-black text-rose-600 tracking-tight block mt-1">₹{totalPendingCollection.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">With active dispatches out on rent</span>
          </div>
        </div>
      </div>

      {/* METRICS & EXPORTS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* COLUMN 1: Stock occupancy & metrics stats (Cols 3) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-display font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-3">
            <Layers className="w-4.5 h-4.5 text-primary-600 mr-2" />
            Asset Occupancy & Condition Auditor
          </h3>

          {/* Occupancy ratio bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-end text-xs">
              <span className="text-slate-600 font-semibold">Active Rental Occupancy Ratio:</span>
              <span className="font-mono font-bold text-primary-600 text-sm">{occupancyPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-500 rounded-full"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block leading-snug">
              Represents percentage of items currently with clients out of total registered warehouse stock.
            </span>
          </div>

          {/* Stock Condition Ledger metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-mono text-[9px] uppercase font-bold block">Active SKUs</span>
              <span className="text-lg font-display font-bold text-slate-800 block mt-1">{totalSkusCount}</span>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-mono text-[9px] uppercase font-bold block">Units Available</span>
              <span className="text-lg font-display font-bold text-slate-800 block mt-1">{availableUnits}</span>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-mono text-[9px] uppercase font-bold block">Units In-Use</span>
              <span className="text-lg font-display font-bold text-slate-800 block mt-1">{outOnRentUnits}</span>
            </div>
            <div className="p-3.5 bg-amber-50/20 rounded-xl border border-amber-100">
              <span className="text-amber-600 font-mono text-[9px] uppercase font-bold block">In Repair</span>
              <span className="text-lg font-display font-bold text-amber-700 block mt-1">{inMaintenanceUnits}</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Fast Excel Compilation & Downloads (Cols 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-3">
              <FileSpreadsheet className="w-4.5 h-4.5 text-primary-600 mr-2" />
              SaaS Worksheet Exports
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
              Compile and trigger Excel spreadsheets directly from active client and order tables. These comply with offline audit requirements.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => triggerExcelExport("inventory")}
              disabled={exportingType !== null}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-between px-4"
            >
              <span className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-primary-500" />
                <span>Export Inventory Warehouse Sheet</span>
              </span>
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => triggerExcelExport("bookings")}
              disabled={exportingType !== null}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-between px-4"
            >
              <span className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export Rent Ledger Sheet</span>
              </span>
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => triggerExcelExport("customers")}
              disabled={exportingType !== null}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-between px-4"
            >
              <span className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>Export Customer Directory Sheet</span>
              </span>
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
