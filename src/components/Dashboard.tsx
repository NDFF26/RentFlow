/**
 * RentFlow Executive Dashboard Component
 * Aggregates live statistical counters, financial summary widgets,
 * custom SVG revenue and booking charts, and live operational feeds.
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { BookingStatus, ItemStatus } from "../types";
import {
  CalendarDays,
  Undo2,
  PackageCheck,
  TrendingUp,
  Receipt,
  AlertCircle,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  UserPlus
} from "lucide-react";

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  setBookingPrefillCust?: (custId: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const { bookings, items, returns, customers, settings } = useApp();

  // Basic Calculations based on REALTIME local state
  const todayStr = new Date().toISOString().split("T")[0];

  const bookingsToday = bookings.filter((b) => {
    const isDispatched = b.bookingStatus === BookingStatus.DELIVERED;
    const isToday = b.rentalStartDate === todayStr || (b.updatedAt && b.updatedAt.substring(0, 10) === todayStr);
    return isDispatched && isToday;
  });
  const returnsToday = bookings.filter(
    (b) => b.returnDate === todayStr && b.bookingStatus === BookingStatus.DELIVERED
  );

  const totalActiveDeposits = customers.reduce((sum, c) => sum + (c.currentDeposit || 0), 0);

  // Monthly revenue calculation (Current Month)
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const currentMonthBookings = bookings.filter(
    (b) => b.createdAt.substring(0, 7) === currentMonthPrefix && b.bookingStatus !== BookingStatus.CANCELLED
  );
  const monthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + b.totalRent, 0);

  const totalItemsCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalBookedItemsCount = items.reduce((sum, i) => sum + (Number(i.bookedQuantity) || 0) + (Number(i.outQuantity) || 0), 0);
  const allocationRatePercentage = totalItemsCount > 0 
    ? Math.round((totalBookedItemsCount / totalItemsCount) * 100) 
    : 0;

  // Available physically in warehouse = total - (out + lost + maintenance)
  const totalUnavailableInWarehouse = items.reduce(
    (sum, i) => sum + (Number(i.outQuantity) || 0) + (Number(i.maintenanceQuantity) || 0) + (Number(i.lostQuantity) || 0),
    0
  );
  const availableInWarehouse = Math.max(0, totalItemsCount - totalUnavailableInWarehouse);

  // Overdue Returns counting
  const overdueCount = bookings.filter((b) => {
    const isOut = b.bookingStatus === BookingStatus.DELIVERED;
    const isPastReturn = new Date(b.returnDate).getTime() < Date.now();
    return isOut && isPastReturn;
  }).length;

  // Prepare custom chart datasets (Last 6 Months)
  const getMonthlyDataset = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short" });
      const yearMonth = d.toISOString().substring(0, 7);
      
      const monthB = bookings.filter(b => b.createdAt.startsWith(yearMonth) && b.bookingStatus !== BookingStatus.CANCELLED);
      const rentSum = monthB.reduce((sum, b) => sum + b.totalRent, 0);
      const count = monthB.length;

      months.push({ label, rentSum, count });
    }
    return months;
  };

  const monthlyStats = getMonthlyDataset();
  const maxRent = Math.max(...monthlyStats.map(m => m.rentSum), 10000);

  // Top Renting Items
  const getTopRentingItems = () => {
    const list = [...items].sort((a, b) => b.bookedQuantity - a.bookedQuantity).slice(0, 3);
    return list;
  };
  const topItems = getTopRentingItems();

  // Upcoming Returns List
  const upcomingReturns = bookings
    .filter((b) => b.bookingStatus === BookingStatus.DELIVERED)
    .sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime())
    .slice(0, 4);

  // Recent Bookings
  const recentBookings = bookings.slice(0, 4);

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center">
            Dashboard Overview <Zap className="w-5 h-5 ml-2 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Realtime monitoring of your asset allocations, cash flows, and scheduled calendar dispatches.
          </p>
        </div>

        {/* QUICK ACTIONS DOCK */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentTab("bookings")}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-semibold shadow-sm shadow-primary-600/15 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Booking</span>
          </button>
          <button
            onClick={() => setCurrentTab("customers")}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold border border-slate-200/80 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>New Customer</span>
          </button>
          <button
            onClick={() => setCurrentTab("inventory")}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold border border-slate-200/80 cursor-pointer transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* OVERDUE ALERTS STRIP */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-rose-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-semibold text-sm">Overdue Returns Active: </span>
              <span className="text-xs text-rose-700">{overdueCount} bookings have crossed scheduled return date deadlines. Please check returns queue.</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab("returns")}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center space-x-1 hover:underline cursor-pointer"
          >
            <span>Resolve now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* COUNTERS METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Metric 01: Today Bookings */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono tracking-wider block uppercase font-bold">
              Today dispatches
            </span>
            <span className="text-xl md:text-2xl font-display font-bold text-slate-950">
              {bookingsToday.length}
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary-600">
            <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        {/* Metric 02: Today Returns */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono tracking-wider block uppercase font-bold">
              Returns Due Today
            </span>
            <span className="text-xl md:text-2xl font-display font-bold text-slate-950">
              {returnsToday.length}
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Undo2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        {/* Metric 03: Cash Bookings Month */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono tracking-wider block uppercase font-bold">
              Monthly Revenue
            </span>
            <span className="text-xl md:text-2xl font-display font-bold text-slate-950">
              ₹{monthlyRevenue.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        {/* Metric 04: Deposits Held */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono tracking-wider block uppercase font-bold">
              Active Deposits Held
            </span>
            <span className="text-xl md:text-2xl font-display font-bold text-slate-950">
              ₹{totalActiveDeposits.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
            <Receipt className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* STATS VISUALS BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPH 01: Revenue Trends Custom SVG Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center">
              Monthly Bookings Cash Flow (INR)
            </h3>
            <p className="text-[11px] text-slate-400">Past six months financial billing trends aggregated from live booking receipts.</p>
          </div>

          {/* Graphical Bars layout */}
          <div className="h-44 flex items-end space-x-4 md:space-x-8 pt-4 pb-2 px-1">
            {monthlyStats.map((m, i) => {
              const heightPct = Math.max(5, (m.rentSum / maxRent) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-6 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-mono">
                    {m.count} Bookings / ₹{m.rentSum.toLocaleString("en-IN")}
                  </div>
                  
                  {/* Graphical Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-blue-100 group-hover:bg-primary-600 rounded-t-md transition-all duration-300"
                  />
                  
                  {/* Label */}
                  <span className="text-[11px] font-mono text-slate-400 font-medium mt-2">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 02: Stock availability & Top Renters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Stock Allocation Rate
            </h3>
            <p className="text-[11px] text-slate-400">Total volume of stock currently rented or scheduled.</p>
          </div>

          <div className="py-5 flex items-center space-x-4">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              {/* Simple Circle Loader representation */}
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-slate-100 fill-none" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-primary-600 fill-none"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - allocationRatePercentage / 100)}`}
                />
              </svg>
              <span className="absolute text-sm font-bold font-mono text-slate-800">
                {allocationRatePercentage}%
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">Available in warehouse:</span>
              <span className="text-lg font-bold text-slate-900">{availableInWarehouse} / {totalItemsCount} units</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Top Renting Outfits</span>
            <div className="space-y-2">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-[10px] text-slate-500">{idx + 1}</span>
                    <span className="font-medium text-slate-700 truncate">{item.itemName}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold shrink-0">({item.bookedQuantity} Booked)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT OPERATIONAL FEEDS TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Bookings Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center">
              <CalendarDays className="w-4 h-4 text-primary-600 mr-2" /> Recent Rental bookings
            </h3>
            <button
              onClick={() => setCurrentTab("bookings")}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-5">Booking ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Rental Range</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5 pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{b.id}</td>
                    <td className="p-3.5 font-medium text-slate-800">{b.customerName}</td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {b.rentalStartDate} to {b.returnDate}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">₹{b.totalRent.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 pr-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                        b.bookingStatus === BookingStatus.CONFIRMED ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        b.bookingStatus === BookingStatus.DELIVERED ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        b.bookingStatus === BookingStatus.RETURNED ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                      No bookings recorded in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deliveries/Returns Dispatch Check */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center">
              <Clock className="w-4 h-4 text-orange-500 mr-2" /> Active dispatches awaiting return
            </h3>
            <button
              onClick={() => setCurrentTab("returns")}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage returns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-5">Booking ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Return Date</th>
                  <th className="p-3.5">Deposit Held</th>
                  <th className="p-3.5 pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingReturns.map((b) => {
                  const isOverdue = new Date(b.returnDate).getTime() < Date.now();
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{b.id}</td>
                      <td className="p-3.5 font-medium text-slate-800">{b.customerName}</td>
                      <td className={`p-3.5 font-mono font-bold ${isOverdue ? "text-rose-600 animate-pulse" : "text-slate-500"}`}>
                        {b.returnDate} {isOverdue && "(Overdue)"}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-700">₹{b.securityDeposit.toLocaleString("en-IN")}</td>
                      <td className="p-3.5 pr-5">
                        <button
                          onClick={() => setCurrentTab("returns")}
                          className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-md hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors text-[10px] font-bold cursor-pointer"
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {upcomingReturns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                      No active dispatches are awaiting return.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
