/**
 * RentFlow Customers Directory Component
 * Handles customer contact registration, credit/holding deposits,
 * detailed rental order ledgers, and safe deletion policies.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, Search, X, Users2, FileText, CheckCircle2, History } from "lucide-react";
import { Customer, Booking, BookingStatus } from "../types";

export const Customers: React.FC = () => {
  const { customers, bookings, currentUser } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddMode = () => {
    setEditingCustomer(null);
    setHistoryCustomer(null);
    setCustomerName("");
    setMobileNumber("");
    setAlternateMobile("");
    setAddress("");
    setCity("Mumbai");
    setNotes("");
    setStatus("Active");
    setIsDrawerOpen(true);
  };

  const openEditMode = (cust: Customer) => {
    setEditingCustomer(cust);
    setHistoryCustomer(null);
    setCustomerName(cust.customerName);
    setMobileNumber(cust.mobileNumber);
    setAlternateMobile(cust.alternateMobile || "");
    setAddress(cust.address);
    setCity(cust.city);
    setNotes(cust.notes || "");
    setStatus(cust.status);
    setIsDrawerOpen(true);
  };

  const openHistoryMode = (cust: Customer) => {
    setHistoryCustomer(cust);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !mobileNumber.trim() || !address.trim()) {
      toast.error("Name, Mobile number, and Address are required.");
      return;
    }
    if (mobileNumber.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        // Edit Mode
        await dbService.updateCustomer(editingCustomer.id, {
          customerName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          alternateMobile: alternateMobile.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          notes: notes.trim() || undefined,
          status,
          updatedBy: currentUser?.id || "unknown"
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Modified Profile for Customer: ${customerName}`, "Customers", editingCustomer.id);
        }
        toast.success("Customer profile updated successfully.");
      } else {
        // Add Mode
        const newCust = await dbService.createCustomer({
          customerName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          alternateMobile: alternateMobile.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          notes: notes.trim() || undefined,
          status: "Active",
          createdBy: currentUser?.id || "unknown",
          updatedBy: currentUser?.id || "unknown"
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Created New Customer Profile: ${customerName}`, "Customers", newCust.id);
        }
        toast.success("New Customer profile added.");
      }
      setIsDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cust: Customer) => {
    setDeletingCustomer(cust);
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      await dbService.deleteCustomer(deletingCustomer.id);
      if (currentUser) {
        await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Deleted Customer Profile: ${deletingCustomer.customerName}`, "Customers", deletingCustomer.id);
      }
      toast.success("Customer deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Could not delete customer.");
    } finally {
      setDeletingCustomer(null);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery)
  );

  // Retrieve matching bookings for history modal
  const getCustomerBookings = (customerId: string) => {
    return bookings.filter((b) => b.customerId === customerId);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Customers Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register client files, log default notes, look up rental histories, and view outstanding deposits.
          </p>
        </div>
        <button
          onClick={openAddMode}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search customers by name or 10-digit mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Client Name</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">City / Address</th>
                <th className="p-4">Rent History</th>
                <th className="p-4">Deposit Held</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <span className="font-semibold text-slate-800 block">{cust.customerName}</span>
                      {cust.notes && <span className="text-[10px] text-slate-400 truncate block max-w-xs mt-0.5">{cust.notes}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-medium text-slate-600">
                    {cust.mobileNumber}
                    {cust.alternateMobile && <span className="block text-[10px] text-slate-400 font-mono">Alt: {cust.alternateMobile}</span>}
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs truncate">
                    <span className="font-semibold block text-slate-700">{cust.city}</span>
                    <span className="text-[10px] block truncate mt-0.5">{cust.address}</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openHistoryMode(cust)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors rounded-lg font-mono font-bold text-slate-600 inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <History className="w-3 h-3 mr-0.5" />
                      <span>{cust.totalBookings} times</span>
                    </button>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">₹{cust.currentDeposit.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                      cust.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6 space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditMode(cust)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust)}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex"
                      title="Delete Customer Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto space-y-3">
                      <Users2 className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">No Customer Records Found</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Start logging event coordinators by creating a customer card.</p>
                      </div>
                      <button
                        onClick={openAddMode}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Create Customer Profile
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL HISTORY POPUP OVERLAY */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setHistoryCustomer(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up z-10">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-display font-bold text-slate-800 text-sm">Rental Ledger: {historyCustomer.customerName}</span>
                <span className="block text-[10px] text-slate-400 font-mono -mt-1">Active Deposit Held: ₹{historyCustomer.currentDeposit.toLocaleString("en-IN")}</span>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {getCustomerBookings(historyCustomer.id).length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-mono text-xs">
                  This client has no logged booking history.
                </div>
              ) : (
                <div className="space-y-3">
                  {getCustomerBookings(historyCustomer.id).map((b) => (
                    <div key={b.id} className="p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/40 flex items-center justify-between text-xs transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{b.id}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold tracking-wide ${
                            b.bookingStatus === BookingStatus.CONFIRMED ? "bg-blue-50 text-blue-700" :
                            b.bookingStatus === BookingStatus.DELIVERED ? "bg-amber-50 text-amber-700" :
                            b.bookingStatus === BookingStatus.RETURNED ? "bg-emerald-50 text-emerald-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          Rental duration: {b.rentalStartDate} to {b.returnDate}
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="font-mono font-bold text-slate-800 block">Total: ₹{b.totalRent.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">Sec. Deposit: ₹{b.securityDeposit.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT DRAW PANEL */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div>
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-display font-bold text-slate-800 text-sm">
                  {editingCustomer ? "Update Customer Card" : "Register New Client"}
                </span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    Customer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Devendra Singh"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit primary mob"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Alternate Mobile
                    </label>
                    <input
                      type="tel"
                      placeholder="Alt contact (optional)"
                      maxLength={10}
                      value={alternateMobile}
                      onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                    />
                  </div>
                  {editingCustomer && (
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Status Code
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors cursor-pointer bg-white"
                      >
                        <option value="Active">Active File</option>
                        <option value="Inactive">Inactive File</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    Shipping/Billing Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Full postal address for booking deliveries..."
                    value={address}
                    rows={3}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    Internal Operator Notes
                  </label>
                  <textarea
                    placeholder="Preferred outfit colors, measurements, VIP references, etc..."
                    value={notes}
                    rows={2}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary-600 text-white hover:bg-primary-700 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : editingCustomer ? "Save Changes" : "Register Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STATE-BASED CONFIRMATION DIALOG */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setDeletingCustomer(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 z-10 text-center animate-slide-up">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">Delete Customer Profile</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Are you sure you want to delete customer <strong className="font-semibold text-slate-800">"{deletingCustomer.customerName}"</strong>? Historical booking integrity must be preserved.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomer}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
