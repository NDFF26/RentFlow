/**
 * RentFlow Return Manager Component
 * Handles the recovery of dispatches, asset condition audits,
 * damage penalties, security deposit releases, and stock updates.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { Search, X, Undo2, ChevronRight, Calculator, Check, AlertTriangle, ShieldCheck, HeartCrack, Ban } from "lucide-react";
import { Booking, BookingItem, ReturnStatus, BookingStatus, ItemStatus } from "../types";
import dayjs from "dayjs";

export const Returns: React.FC = () => {
  const { bookings, currentUser } = useApp();

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Return Processing Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return form variables
  // Record conditions for each item SKU: "Returned" | "Damaged" | "Missing"
  const [itemConditions, setItemConditions] = useState<{ [sku: string]: "Returned" | "Damaged" | "Missing" }>({});
  const [damageAmount, setDamageAmount] = useState(0);

  // Filter only dispatches currently OUT with clients
  const activeDispatches = bookings.filter(
    (b) => b.bookingStatus === BookingStatus.DELIVERED
  );

  const filteredDispatches = activeDispatches.filter((b) =>
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customerMobile.includes(searchQuery)
  );

  const handleOpenReturnDrawer = async (booking: Booking) => {
    setSelectedBooking(booking);
    setIsSubmitting(true);
    try {
      const itemsList = await dbService.getBookingItems(booking.id);
      setBookingItems(itemsList);
      
      // Seed default conditions as fully healthy Returned
      const initialConditions: { [sku: string]: "Returned" | "Damaged" | "Missing" } = {};
      itemsList.forEach((bi) => {
        initialConditions[bi.sku] = "Returned";
      });
      setItemConditions(initialConditions);
      setDamageAmount(0);
      setIsDrawerOpen(true);
    } catch (err) {
      toast.error("Failed to retrieve booking items.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConditionChange = (sku: string, condition: "Returned" | "Damaged" | "Missing") => {
    setItemConditions({
      ...itemConditions,
      [sku]: condition
    });
  };

  // CALCULATIONS FOR LIVE RETURN FORM
  // Security deposit currently held on this booking
  const heldDeposit = selectedBooking?.securityDeposit || 0;
  // Outstanding rent balance remaining to be paid
  const outstandingRent = selectedBooking?.remainingAmount || 0;

  // Deposit refund is original deposit minus damage fee. Refund cannot be negative.
  const depositRefund = Math.max(0, heldDeposit - damageAmount);
  // If damage fee exceeds deposit, the excess damage must be collected from client
  const excessDamageFee = Math.max(0, damageAmount - heldDeposit);
  // Final outstanding balance to collect or settle
  const finalBalanceRemaining = outstandingRent + excessDamageFee - (depositRefund < 0 ? 0 : 0); // outstanding rent remains to be collected

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      const payload = {
        bookingId: selectedBooking.id,
        customerId: selectedBooking.customerId,
        customerName: selectedBooking.customerName,
        returnDate: new Date().toISOString(),
        returnedBy: currentUser?.fullName || "Staff Operator",
        damageAmount,
        depositRefund,
        remainingAmount: finalBalanceRemaining,
        returnStatus: ReturnStatus.COMPLETED,
        items: bookingItems.map((bi) => ({
          sku: bi.sku,
          itemName: bi.itemName,
          quantity: bi.quantity,
          condition: itemConditions[bi.sku] || "Returned"
        }))
      };

      await dbService.processReturn(payload, currentUser?.id || "unknown");
      setIsDrawerOpen(false);
      toast.success(`Return records processed successfully for Booking ${selectedBooking.id}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return checklist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Return Management Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process incoming returns, perform fabric/device inspection, adjust damage fees, and release security deposits.
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search active dispatches by client name, mobile, booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* DISPATCHED ITEMS TABLE LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Booking ID</th>
                <th className="p-4">Customer Info</th>
                <th className="p-4">Scheduled Return</th>
                <th className="p-4">Held Deposit</th>
                <th className="p-4">Oustanding Rent</th>
                <th className="p-4">State</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.map((b) => {
                const isOverdue = new Date(b.returnDate).getTime() < Date.now();
                return (
                  <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-800 block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{b.customerMobile}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      <span className={`font-bold ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                        {b.returnDate}
                      </span>
                      {isOverdue && <span className="block text-[9px] text-rose-500 font-bold tracking-wider uppercase mt-0.5">⚠️ Overdue</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">₹{b.securityDeposit.toLocaleString("en-IN")}</td>
                    <td className="p-4 font-mono font-bold text-rose-600">₹{b.remainingAmount.toLocaleString("en-IN")}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                        Out with Client
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleOpenReturnDrawer(b)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-primary-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center space-x-1"
                      >
                        <span>Audit & Receive</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredDispatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto space-y-3">
                      <Undo2 className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">No Active Dispatches Discovered</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">All items are back in the warehouse. Excellent asset occupancy!</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED RECEIVE RETURN DRAWER */}
      {isDrawerOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="font-display font-bold text-slate-800 text-sm block">Inspect & Return: {selectedBooking.id}</span>
                  <span className="text-[10px] text-slate-400 block font-mono -mt-1">Client: {selectedBooking.customerName}</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitReturn} className="p-6 space-y-6">
                
                {/* ITEMS CONDITION SECTOR */}
                <div className="space-y-3">
                  <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">
                    Inspect each item condition <span className="text-rose-500">*</span>
                  </span>
                  
                  <div className="space-y-3">
                    {bookingItems.map((bi) => {
                      const currentCond = itemConditions[bi.sku] || "Returned";
                      return (
                        <div key={bi.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{bi.sku}</span>
                            <span className="font-semibold text-slate-700 block mt-0.5">{bi.itemName}</span>
                            <span className="text-slate-400 font-mono text-[10px] block mt-0.5">Quantity rented: {bi.quantity} unit(s)</span>
                          </div>

                          {/* Selector Buttons */}
                          <div className="flex space-x-1.5 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleConditionChange(bi.sku, "Returned")}
                              className={`px-2.5 py-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center space-x-1 ${
                                currentCond === "Returned"
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Ok (Returned)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConditionChange(bi.sku, "Damaged")}
                              className={`px-2.5 py-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center space-x-1 ${
                                currentCond === "Damaged"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Damaged</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConditionChange(bi.sku, "Missing")}
                              className={`px-2.5 py-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center space-x-1 ${
                                currentCond === "Missing"
                                  ? "bg-rose-500 text-white shadow-xs"
                                  : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <HeartCrack className="w-3.5 h-3.5" />
                              <span>Missing / Lost</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LEDGER ADJUSTMENTS */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">
                    Penalties & Refund settlements
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-xs">
                      <span className="text-slate-400 block font-mono text-[9px] uppercase font-bold">Deposit Held</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">₹{heldDeposit.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-xs">
                      <span className="text-slate-400 block font-mono text-[9px] uppercase font-bold">Outstanding Rent Due</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">₹{outstandingRent.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      Damage Penalty Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={damageAmount}
                      onChange={(e) => setDamageAmount(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Deducted from security deposit held. Excess is added to outstanding dues.</p>
                  </div>
                </div>

              </form>
            </div>

            {/* Calculations & Submit */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4 shrink-0 text-xs">
              <span className="font-bold text-[10px] font-mono text-slate-400 block uppercase">FINAL RECEIPT SUMMARY</span>
              
              <div className="space-y-2 text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-mono text-slate-700">₹{heldDeposit.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deducted Damage Fee:</span>
                  <span className="font-mono text-rose-600">-₹{damageAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800">
                  <span>Net Deposit Refund to Client:</span>
                  <span className="font-mono text-emerald-600">₹{depositRefund.toLocaleString("en-IN")}</span>
                </div>
                {excessDamageFee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Excess Damage Claim:</span>
                    <span className="font-mono">₹{excessDamageFee.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Outstanding Booking Rent:</span>
                  <span className="font-mono text-slate-700">₹{outstandingRent.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-rose-600">
                  <span>Net Collection from Client:</span>
                  <span className="font-mono text-rose-700">
                    ₹{(outstandingRent + excessDamageFee).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel audit
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Finalizing Audit..." : "Acknowledge Return & Close"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
