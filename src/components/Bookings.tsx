/**
 * RentFlow Booking & Availability Engine Component
 * Features a multi-item cart, live date-overlap stock verification,
 * a real-time ledger sheet, an A4 invoice generator, and WhatsApp notifications.
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  X,
  Calendar,
  ShoppingCart,
  Trash2,
  FileText,
  Printer,
  MessageSquare,
  ChevronRight,
  Info,
  CalendarPlus,
  Receipt,
  FileCheck2,
  Users,
  CheckCircle2
} from "lucide-react";
import { Booking, BookingStatus, InventoryItem, Customer, BookingItem } from "../types";
import dayjs from "dayjs";

interface BookingsProps {
  setCurrentTab?: (tab: string) => void;
}

export const Bookings: React.FC<BookingsProps> = ({ setCurrentTab }) => {
  const { bookings, items, customers, settings, currentUser } = useApp();

  // Navigation / View states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  // Custom dispatch payment verification modal state
  const [dispatchModal, setDispatchModal] = useState<{
    isOpen: boolean;
    booking: Booking;
    paymentInput: string;
    error: string | null;
  } | null>(null);

  // Custom success/"What's Next" modal state
  const [whatsNextModal, setWhatsNextModal] = useState<{
    isOpen: boolean;
    booking: Booking;
  } | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [viewingBookingItems, setViewingBookingItems] = useState<BookingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart / Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rentalReturnDate, setRentalReturnDate] = useState(dayjs().add(2, "day").format("YYYY-MM-DD"));
  const [invoiceType, setInvoiceType] = useState<"Normal" | "GST">("Normal");
  const [discount, setDiscount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  // Cart Items: { sku: string; item: InventoryItem; qty: number; avail: number }
  const [cart, setCart] = useState<{ sku: string; item: InventoryItem; qty: number; avail: number }[]>([]);

  // Search/Filters for lists
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Customer fast-create state in booking drawer
  const [fastCustName, setFastCustName] = useState("");
  const [fastCustMobile, setFastCustMobile] = useState("");
  const [fastCustAddress, setFastCustAddress] = useState("");
  const [showFastCustForm, setShowFastCustForm] = useState(false);

  // Re-verify availability of items in cart when dates or cart changes
  useEffect(() => {
    if (!rentalStartDate || !rentalReturnDate || cart.length === 0) return;

    const reVerifyAvail = async () => {
      const updatedCart = await Promise.all(
        cart.map(async (entry) => {
          try {
            const availRes = await dbService.checkAvailability(entry.sku, rentalStartDate, rentalReturnDate);
            return {
              ...entry,
              avail: availRes.available + (editingItemQtyInBooking(entry.sku) || 0) // factor in editing reservation if applicable
            };
          } catch (e) {
            return entry;
          }
        })
      );
      setCart(updatedCart);
    };

    reVerifyAvail();
  }, [rentalStartDate, rentalReturnDate]);

  const editingItemQtyInBooking = (sku: string) => {
    // Left empty since we support creation and status changes in listings
    return 0;
  };

  // Duration computation
  const rentalDurationDays = Math.max(1, dayjs(rentalReturnDate).diff(dayjs(rentalStartDate), "day"));

  // CART CALCULATIONS
  const cartSubtotalRent = cart.reduce((sum, entry) => sum + (entry.item.rentPrice * entry.qty * rentalDurationDays), 0);
  const cartSubtotalDeposit = cart.reduce((sum, entry) => sum + (entry.item.securityDeposit * entry.qty), 0);
  const gstValue = invoiceType === "GST" && settings?.gstEnabled ? Math.round(cartSubtotalRent * 0.18) : 0;
  const totalAmountDue = cartSubtotalRent + cartSubtotalDeposit + gstValue - discount;
  const remainingBalance = totalAmountDue - advanceAmount;

  const handleOpenAddBooking = () => {
    setSelectedCustomerId(customers[0]?.id || "");
    setRentalStartDate(dayjs().format("YYYY-MM-DD"));
    setRentalReturnDate(dayjs().add(2, "day").format("YYYY-MM-DD"));
    setInvoiceType("Normal");
    setDiscount(0);
    setAdvanceAmount(0);
    setCart([]);
    setShowFastCustForm(false);
    setFastCustName("");
    setFastCustMobile("");
    setFastCustAddress("");
    setIsDrawerOpen(true);
  };

  const handleAddFastCustomer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fastCustName.trim() || !fastCustMobile.trim() || !fastCustAddress.trim()) {
      toast.error("Please fill Name, Mobile and Address for fast creation.");
      return;
    }
    try {
      const newCust = await dbService.createCustomer({
        customerName: fastCustName.trim(),
        mobileNumber: fastCustMobile.trim(),
        address: fastCustAddress.trim(),
        city: settings?.city || "Mumbai",
        status: "Active",
        createdBy: currentUser?.id || "unknown",
        updatedBy: currentUser?.id || "unknown"
      });
      setSelectedCustomerId(newCust.id);
      setShowFastCustForm(false);
      toast.success("Fast customer profile logged and preselected.");
    } catch (err: any) {
      toast.error(err.message || "Fast customer registration failed.");
    }
  };

  const handleAddToCart = async (item: InventoryItem) => {
    // 1. Verify date parameters
    if (!rentalStartDate || !rentalReturnDate) {
      toast.error("Please pick rental duration dates first.");
      return;
    }

    // 2. Check if already inside cart
    const exists = cart.find((entry) => entry.sku === item.sku);
    if (exists) {
      if (exists.qty + 1 > exists.avail) {
        toast.error(`Stock limit reached! Only ${exists.avail} items are available.`);
        return;
      }
      setCart(cart.map((entry) => (entry.sku === item.sku ? { ...entry, qty: entry.qty + 1 } : entry)));
    } else {
      // Fetch dynamic availability
      try {
        const { available } = await dbService.checkAvailability(item.sku, rentalStartDate, rentalReturnDate);
        if (available < 1) {
          toast.error(`SKU ${item.sku} is out of stock / committed for these dates.`);
          return;
        }
        setCart([...cart, { sku: item.sku, item, qty: 1, avail: available }]);
        toast.success(`"${item.itemName}" added to booking cart.`);
      } catch (err: any) {
        toast.error(err.message || "Availability check failed.");
      }
    }
  };

  const handleRemoveFromCart = (sku: string) => {
    setCart(cart.filter((entry) => entry.sku !== sku));
  };

  const handleQtyChange = (sku: string, newQty: number) => {
    const entry = cart.find((e) => e.sku === sku);
    if (!entry) return;

    if (newQty < 1) {
      handleRemoveFromCart(sku);
      return;
    }

    if (newQty > entry.avail) {
      toast.error(`Overbooking Prevented: Only ${entry.avail} items are available.`);
      return;
    }

    setCart(cart.map((e) => (e.sku === sku ? { ...e, qty: newQty } : e)));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error("Please assign a customer profile.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Booking cart is empty. Add items first.");
      return;
    }
    if (remainingBalance < 0) {
      toast.error("Advance amount cannot exceed total invoice due.");
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId)!;

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: customer.id,
        customerName: customer.customerName,
        customerMobile: customer.mobileNumber,
        bookingDate: new Date().toISOString(),
        rentalStartDate,
        returnDate: rentalReturnDate,
        bookingStatus: BookingStatus.CONFIRMED, // Defaults to confirmed upon registration
        totalRent: cartSubtotalRent,
        securityDeposit: cartSubtotalDeposit,
        discount,
        advanceAmount,
        remainingAmount: remainingBalance,
        invoiceType,
        createdBy: currentUser?.id || "unknown",
        updatedBy: currentUser?.id || "unknown"
      };

      const itemsPayload = cart.map((entry) => ({
        sku: entry.sku,
        quantity: entry.qty
      }));

      const newBooking = await dbService.createBooking(payload, itemsPayload);
      setIsDrawerOpen(false);
      toast.success(`Booking ${newBooking.id} generated!`);
      // Open invoice view instantly for confirmation delight
      handleOpenInvoice(newBooking);
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInvoice = async (booking: Booking) => {
    try {
      const bookingItems = await dbService.getBookingItems(booking.id);
      setViewingBooking(booking);
      setViewingBookingItems(bookingItems);
    } catch (err: any) {
      toast.error("Failed to load invoice items.");
    }
  };

  const handleDispatchBooking = (booking: Booking) => {
    setDispatchModal({
      isOpen: true,
      booking,
      paymentInput: "",
      error: null
    });
  };

  const handleConfirmDispatchAction = async () => {
    if (!dispatchModal) return;
    const { booking, paymentInput } = dispatchModal;
    const additionalPayment = Number(paymentInput) || 0;
    const totalPayments = booking.advanceAmount + additionalPayment;

    const gstAmount = booking.invoiceType === "GST" && settings?.gstEnabled ? Math.round(booking.totalRent * 0.18) : 0;
    const finalAmount = booking.totalRent + booking.securityDeposit + gstAmount - booking.discount;

    const isMatch = totalPayments === finalAmount;

    if (!isMatch) {
      setDispatchModal({
        ...dispatchModal,
        error: `Payment mismatch: Total payments (₹${totalPayments.toLocaleString("en-IN")}) do not match the final amount (₹${finalAmount.toLocaleString("en-IN")}). Received payment must exactly clear the balance before dispatching!`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedBooking = await dbService.updateBookingStatus(
        booking.id,
        BookingStatus.DELIVERED,
        currentUser?.id || "unknown",
        {
          advanceAmount: totalPayments,
          remainingAmount: 0
        }
      );

      toast.success("Booking status set to Dispatched! Ledger is fully matched.");
      setDispatchModal(null);

      setWhatsNextModal({
        isOpen: true,
        booking: updatedBooking
      });

      if (viewingBooking && viewingBooking.id === booking.id) {
        setViewingBooking({
          ...viewingBooking,
          bookingStatus: BookingStatus.DELIVERED,
          advanceAmount: totalPayments,
          remainingAmount: 0
        });
      }
    } catch (err: any) {
      setDispatchModal({
        ...dispatchModal,
        error: err.message || "Failed to dispatch booking."
      });
      toast.error(err.message || "Failed to dispatch booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Rental Order",
      message: `Are you sure you want to cancel booking ${booking.id}? This will release all committed inventory reservations back into the active stock pool. This action cannot be undone.`,
      confirmText: "Yes, Cancel Order",
      cancelText: "Keep Order Active",
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSubmitting(true);
        try {
          await dbService.updateBookingStatus(booking.id, BookingStatus.CANCELLED, currentUser?.id || "unknown");
          toast.success("Booking cancelled successfully.");
          if (viewingBooking && viewingBooking.id === booking.id) {
            setViewingBooking({ ...viewingBooking, bookingStatus: BookingStatus.CANCELLED });
          }
        } catch (err: any) {
          toast.error(err.message || "Cancellation failed.");
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  // Trigger browser printing for A4 invoice
  const triggerPrint = () => {
    window.print();
  };

  // WhatsApp formatted string fast redirection
  const getWhatsAppMessage = (b: Booking) => {
    if (!settings) return "";
    const text = `Hello ${b.customerName},

This is an official receipt from *${settings.companyName}*.
*Invoice No:* ${b.invoiceNumber}
*Rental Dates:* ${b.rentalStartDate} to ${b.returnDate}

*Summary:*
- Total Rent Price: ₹${b.totalRent}
- Refundable Security Deposit: ₹${b.securityDeposit}
- Discount Applied: ₹${b.discount}
- Advance Paid: ₹${b.advanceAmount}
- *Balance Remaining:* ₹${b.remainingAmount}

Thank you for renting with RentFlow. Have a magnificent event!`;

    return `https://wa.me/91${b.customerMobile}?text=${encodeURIComponent(text)}`;
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerMobile.includes(searchQuery) ||
      b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Rental Calendar & Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create new rental accounts, checkout multiple pieces, track delivery states, and manage invoice dispatches.
          </p>
        </div>
        <button
          onClick={handleOpenAddBooking}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>New Booking Checkout</span>
        </button>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search bookings by customer mobile, ID, invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors cursor-pointer text-slate-600 bg-white"
        >
          <option value="">All Booking States</option>
          <option value={BookingStatus.CONFIRMED}>Confirmed (Booked)</option>
          <option value={BookingStatus.DELIVERED}>Delivered (Out with Client)</option>
          <option value={BookingStatus.RETURNED}>Returned (Completed)</option>
          <option value={BookingStatus.CANCELLED}>Cancelled</option>
        </select>
      </div>

      {/* BOOKINGS TABLE LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Booking ID</th>
                <th className="p-4">Customer Info</th>
                <th className="p-4">Rental Duration</th>
                <th className="p-4">Financials (Rent/Deposit)</th>
                <th className="p-4">Outstanding Due</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-slate-900">{b.id}</td>
                  <td className="p-4">
                    <div>
                      <span className="font-semibold text-slate-800 block">{b.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{b.customerMobile}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-mono">
                    <div className="font-semibold text-slate-700">
                      {b.rentalStartDate} to {b.returnDate}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Duration: {Math.max(1, dayjs(b.returnDate).diff(dayjs(b.rentalStartDate), "day"))} day(s)
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-600">
                    <div>Rent: ₹{b.totalRent.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-slate-400">Deposit: ₹{b.securityDeposit.toLocaleString("en-IN")}</div>
                  </td>
                  <td className="p-4">
                    <span className={`font-mono font-bold text-xs ${b.remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ₹{b.remainingAmount.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                      b.bookingStatus === BookingStatus.CONFIRMED ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      b.bookingStatus === BookingStatus.DELIVERED ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      b.bookingStatus === BookingStatus.RETURNED ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenInvoice(b)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex"
                      title="View Invoice Sheet"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {b.bookingStatus === BookingStatus.CONFIRMED && (
                      <button
                        onClick={() => handleDispatchBooking(b)}
                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 rounded-md transition-colors text-[10px] font-bold cursor-pointer inline-flex"
                      >
                        Dispatch / OUT
                      </button>
                    )}
                    {b.bookingStatus === BookingStatus.CONFIRMED && (
                      <button
                        onClick={() => handleCancelBooking(b)}
                        className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex"
                        title="Cancel Order"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto space-y-3">
                      <Calendar className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">No Rental Bookings Recorded</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Start checking out outfits and camera pieces to generate orders.</p>
                      </div>
                      <button
                        onClick={handleOpenAddBooking}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Launch Booking Engine
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL-SCREEN PRINTABLE A4 INVOICE SHEET VIEW OVERLAY */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div onClick={() => setViewingBooking(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full h-[90vh] flex flex-col justify-between animate-slide-up z-10">
            {/* Header Controls */}
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-display font-bold text-slate-800 text-xs">A4 Invoice Sheet View</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerPrint}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print (PDF)</span>
                </button>
                <a
                  href={getWhatsAppMessage(viewingBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Invoice via WhatsApp</span>
                </a>
                <button
                  onClick={() => setViewingBooking(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Scrollable Paper */}
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/60 flex justify-center">
              <div className="bg-white border border-slate-200 shadow-md p-8 max-w-[210mm] w-full min-h-[297mm] flex flex-col justify-between text-slate-800 font-sans print-card">
                <div>
                  {/* Branding Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={settings?.companyLogo}
                        alt="Logo"
                        className="w-12 h-12 object-cover rounded-xl"
                      />
                      <div>
                        <span className="font-display font-bold text-xl text-slate-900 tracking-tight block">
                          {settings?.companyName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block max-w-xs mt-0.5">
                          {settings?.businessAddress}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-primary-600 font-display font-bold text-lg block tracking-wider uppercase">
                        RENTAL RECEIPT
                      </span>
                      <span className="font-mono text-slate-400 block mt-1">Invoice ID: {viewingBooking.invoiceNumber}</span>
                      <span className="font-mono text-slate-400 block">Date Generated: {dayjs(viewingBooking.bookingDate).format("DD-MMM-YYYY")}</span>
                    </div>
                  </div>

                  {/* Customer & Event Details */}
                  <div className="grid grid-cols-2 gap-8 py-6 text-xs">
                    <div>
                      <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block font-bold mb-1">RENTED TO:</span>
                      <span className="font-bold text-slate-900 text-sm block">{viewingBooking.customerName}</span>
                      <span className="font-mono text-slate-600 block mt-0.5">Ph: +91 {viewingBooking.customerMobile}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block font-bold mb-1">RENTAL TERMS:</span>
                      <span className="font-bold text-slate-800 block">
                        Dates: {dayjs(viewingBooking.rentalStartDate).format("DD-MMM-YYYY")} to {dayjs(viewingBooking.returnDate).format("DD-MMM-YYYY")}
                      </span>
                      <span className="font-mono text-slate-500 block mt-0.5">
                        Duration: {Math.max(1, dayjs(viewingBooking.returnDate).diff(dayjs(viewingBooking.rentalStartDate), "day"))} Renting Day(s)
                      </span>
                    </div>
                  </div>

                  {/* Rent List Items Table */}
                  <table className="w-full text-xs text-left border-collapse mt-4">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold">
                        <th className="p-3 pl-4">SKU / Item Description</th>
                        <th className="p-3 text-center">Unit Rent</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Sec. Deposit</th>
                        <th className="p-3 text-right pr-4">Rent Price (Total)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingBookingItems.map((bi) => (
                        <tr key={bi.id} className="text-slate-700 font-medium">
                          <td className="p-3 pl-4">
                            <span className="font-mono font-bold text-slate-900 block">{bi.sku}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{bi.itemName}</span>
                          </td>
                          <td className="p-3 text-center font-mono">₹{bi.rentPrice.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-center font-mono font-bold">{bi.quantity}</td>
                          <td className="p-3 text-center font-mono">₹{bi.deposit.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right pr-4 font-mono font-bold text-slate-900">
                            ₹{(bi.rentPrice * bi.quantity * Math.max(1, dayjs(viewingBooking.returnDate).diff(dayjs(viewingBooking.rentalStartDate), "day"))).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculations Ledger */}
                  <div className="flex justify-end mt-8">
                    <div className="w-80 space-y-2 text-xs border-t border-slate-200 pt-4">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Items Rent Subtotal:</span>
                        <span className="font-mono">₹{viewingBooking.totalRent.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Security Deposit (Refundable):</span>
                        <span className="font-mono">₹{viewingBooking.securityDeposit.toLocaleString("en-IN")}</span>
                      </div>
                      {viewingBooking.invoiceType === "GST" && (
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>CGST + SGST (18%):</span>
                          <span className="font-mono">₹{Math.round(viewingBooking.totalRent * 0.18).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {viewingBooking.discount > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-₹{viewingBooking.discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-950">
                        <span>Grand Total Due:</span>
                        <span className="font-mono">
                          ₹{(
                            viewingBooking.totalRent +
                            viewingBooking.securityDeposit +
                            (viewingBooking.invoiceType === "GST" ? Math.round(viewingBooking.totalRent * 0.18) : 0) -
                            viewingBooking.discount
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Advance Paid:</span>
                        <span className="font-mono">₹{viewingBooking.advanceAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-rose-600">
                        <span>Balance Remaining:</span>
                        <span className="font-mono">₹{viewingBooking.remainingAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions print footer */}
                <div className="border-t border-slate-200 pt-6 mt-12 text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                  <span className="font-bold text-slate-600 block uppercase tracking-wide">TERMS AND CONDITIONS:</span>
                  <p>1. The security deposit is fully refundable upon return of rented articles in original physical condition.</p>
                  <p>2. Late return fees will accumulate at 1.5x the standard unit rent price for every exceeding 24 hours.</p>
                  <p>3. In case of irreversible physical damage or asset loss, recovery valuations will be deducted directly from the security holding.</p>
                  <p className="text-center font-mono text-[9px] pt-4">Generated via RentFlow SaaS Engine. Thank you for your business!</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingBooking(null)}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCK INVOICE FOR BROWSER PRINT ONLY (HIDDEN ON SCREEN) */}
      {viewingBooking && (
        <div className="hidden print-only print-card text-slate-800 p-8 w-full">
          {/* Replica of inside printable receipt */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div className="flex items-center space-x-3">
              <img src={settings?.companyLogo} className="w-12 h-12 object-cover rounded-xl" />
              <div>
                <span className="font-bold text-lg text-slate-900 block">{settings?.companyName}</span>
                <span className="text-[10px] text-slate-500 block">{settings?.businessAddress}</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-base text-primary-600 block">RENTAL RECEIPT</span>
              <span className="font-mono block mt-1">Invoice ID: {viewingBooking.invoiceNumber}</span>
              <span className="font-mono block">Date: {dayjs(viewingBooking.bookingDate).format("DD-MMM-YYYY")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-6 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[9px] block uppercase font-bold">RENTED TO:</span>
              <span className="font-bold text-slate-900 text-sm block mt-1">{viewingBooking.customerName}</span>
              <span className="font-mono text-slate-600 block">Ph: +91 {viewingBooking.customerMobile}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-mono text-[9px] block uppercase font-bold">RENTAL RANGE:</span>
              <span className="font-bold text-slate-800 block mt-1">
                {viewingBooking.rentalStartDate} to {viewingBooking.returnDate}
              </span>
              <span className="font-mono text-slate-500 block">
                Duration: {Math.max(1, dayjs(viewingBooking.returnDate).diff(dayjs(viewingBooking.rentalStartDate), "day"))} Renting Day(s)
              </span>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse mt-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-500 font-mono text-[9px] uppercase font-bold">
                <th className="p-3 pl-4">SKU / Item Description</th>
                <th className="p-3 text-center">Unit Rent</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-center">Sec. Deposit</th>
                <th className="p-3 text-right pr-4">Total Rent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewingBookingItems.map((bi) => (
                <tr key={bi.id} className="text-slate-700 font-medium">
                  <td className="p-3 pl-4">
                    <span className="font-mono font-bold text-slate-950 block">{bi.sku}</span>
                    <span className="text-[10px] text-slate-500 block">{bi.itemName}</span>
                  </td>
                  <td className="p-3 text-center font-mono">₹{bi.rentPrice}</td>
                  <td className="p-3 text-center font-mono font-bold">{bi.quantity}</td>
                  <td className="p-3 text-center font-mono">₹{bi.deposit}</td>
                  <td className="p-3 text-right pr-4 font-mono font-bold text-slate-950">
                    ₹{(bi.rentPrice * bi.quantity * Math.max(1, dayjs(viewingBooking.returnDate).diff(dayjs(viewingBooking.rentalStartDate), "day")))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-8 text-xs font-medium">
            <div className="w-80 space-y-2 pt-4 border-t border-slate-300">
              <div className="flex justify-between">
                <span>Rent Subtotal:</span>
                <span>₹{viewingBooking.totalRent}</span>
              </div>
              <div className="flex justify-between">
                <span>Refundable Deposit:</span>
                <span>₹{viewingBooking.securityDeposit}</span>
              </div>
              {viewingBooking.invoiceType === "GST" && (
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{Math.round(viewingBooking.totalRent * 0.18)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm">
                <span>Grand Total Due:</span>
                <span>
                  ₹{viewingBooking.totalRent +
                    viewingBooking.securityDeposit +
                    (viewingBooking.invoiceType === "GST" ? Math.round(viewingBooking.totalRent * 0.18) : 0) -
                    viewingBooking.discount}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Advance Paid:</span>
                <span>₹{viewingBooking.advanceAmount}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1">
                <span>Balance Due:</span>
                <span>₹{viewingBooking.remainingAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENTAL CHECKOUT CREATION DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-display font-bold text-slate-800 text-sm flex items-center">
                  <ShoppingCart className="w-5 h-5 text-primary-600 mr-2" />
                  Interactive Booking Checkout Engine
                </span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Engine Body */}
              <div className="grid grid-cols-1 lg:grid-cols-5 h-[calc(100vh-8rem)]">
                {/* Left Block: Client & Date Settings & Catalog selection (Cols 3) */}
                <div className="lg:col-span-3 p-6 border-r border-slate-100 overflow-y-auto space-y-6">
                  {/* CLIENT SELECTOR */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                        Select Customer Account <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowFastCustForm(!showFastCustForm)}
                        className="text-primary-600 hover:text-primary-700 text-[10px] font-bold underline cursor-pointer"
                      >
                        {showFastCustForm ? "Select Existing Profile" : "Register Fast Profile"}
                      </button>
                    </div>

                    {!showFastCustForm ? (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors bg-white cursor-pointer"
                      >
                        <option value="" disabled>-- Click to pick client --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customerName} ({c.mobileNumber})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <span className="font-bold text-[10px] font-mono text-slate-400 block uppercase">FAST REGISTER CLIENT CARDS</span>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Full Name *"
                            value={fastCustName}
                            onChange={(e) => setFastCustName(e.target.value)}
                            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit Mobile *"
                            value={fastCustMobile}
                            onChange={(e) => setFastCustMobile(e.target.value.replace(/\D/g, ""))}
                            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Postal Shipping Address *"
                          value={fastCustAddress}
                          onChange={(e) => setFastCustAddress(e.target.value)}
                          className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg w-full"
                        />
                        <button
                          type="button"
                          onClick={handleAddFastCustomer}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold w-full cursor-pointer hover:bg-slate-800"
                        >
                          Confirm & Auto-Select Profile
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DATE DURATION PICKERS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Rental Start Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={dayjs().format("YYYY-MM-DD")}
                        value={rentalStartDate}
                        onChange={(e) => setRentalStartDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Rental Return Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={dayjs(rentalStartDate).add(1, "day").format("YYYY-MM-DD")}
                        value={rentalReturnDate}
                        onChange={(e) => setRentalReturnDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  {/* INTERACTIVE WAREHOUSE STOCK BROWSER FOR THE SELECTED PERIOD */}
                  <div className="space-y-3">
                    <span className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                      Warehouse Stock Browser ({rentalDurationDays} Day Rental duration)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map((item) => {
                        // Locate matching item inside cart to check its counts
                        const cartEntry = cart.find((entry) => entry.sku === item.sku);
                        const quantityInCart = cartEntry ? cartEntry.qty : 0;
                        
                        return (
                          <div key={item.id} className="p-3 border border-slate-200/80 hover:border-slate-300 rounded-xl bg-slate-50/20 flex flex-col justify-between space-y-2">
                            <div className="flex items-start space-x-2.5">
                              <img
                                src={item.imageUrl}
                                alt={item.itemName}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                              />
                              <div className="truncate">
                                <span className="font-mono font-bold text-[10px] text-slate-400 block">{item.sku}</span>
                                <span className="font-semibold text-slate-800 block text-xs truncate leading-snug">{item.itemName}</span>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Rent: ₹{item.rentPrice}/day</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                                {item.availableQuantity} units total
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Add item
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Block: Live Checkout shopping cart (Cols 2) */}
                <div className="lg:col-span-2 p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-display font-bold text-slate-800 text-xs flex items-center">
                        <ShoppingCart className="w-4.5 h-4.5 text-primary-600 mr-1.5" />
                        Selected Articles ({cart.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Duration: {rentalDurationDays} day(s)</span>
                    </div>

                    {/* Cart Items list */}
                    <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                      {cart.map((entry) => (
                        <div key={entry.sku} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold text-slate-900 block">{entry.sku}</span>
                            <span className="text-slate-500 font-medium truncate block max-w-[12rem]">{entry.item.itemName}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Deposit: ₹{entry.item.securityDeposit}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 shrink-0">
                            {/* Qty controller */}
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(entry.sku, entry.qty - 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="px-2.5 font-bold font-mono text-slate-700">{entry.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleQtyChange(entry.sku, entry.qty + 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-200"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(entry.sku)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {cart.length === 0 && (
                        <div className="py-12 text-center text-slate-400 font-mono text-xs">
                          Cart is empty. Click "Add item" from the browser catalog.
                        </div>
                      )}
                    </div>

                    {/* Pricing Sheet Controls */}
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <span className="font-bold text-[10px] font-mono text-slate-400 block uppercase">CHECKOUT BALANCE LEDGER</span>
                      
                      {/* GST Options */}
                      {settings?.gstEnabled && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Invoice Tax Type:</span>
                          <div className="flex space-x-1.5 bg-white border border-slate-200 p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setInvoiceType("Normal")}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                                invoiceType === "Normal" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              Normal
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceType("GST")}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                                invoiceType === "GST" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              GST (18%)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Financial Inputs */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 font-mono text-[9px] uppercase font-bold mb-1">
                            Discount (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-mono text-[9px] uppercase font-bold mb-1">
                            Advance Received (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculations Sheet and Submit Booking */}
                  <div className="border-t border-slate-200 pt-4 mt-4 space-y-3.5">
                    <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                      <div className="flex justify-between">
                        <span>Total Items Rent Subtotal:</span>
                        <span className="font-mono text-slate-700">₹{cartSubtotalRent.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Security Deposit:</span>
                        <span className="font-mono text-slate-700">₹{cartSubtotalDeposit.toLocaleString("en-IN")}</span>
                      </div>
                      {invoiceType === "GST" && settings?.gstEnabled && (
                        <div className="flex justify-between">
                          <span>CGST + SGST (18%):</span>
                          <span className="font-mono text-slate-700">₹{gstValue.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-₹{discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {advanceAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Advance Payment:</span>
                          <span className="font-mono">-₹{advanceAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-800">
                        <span>Grand Total Due:</span>
                        <span className="font-mono text-slate-900">₹{totalAmountDue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-black text-rose-600">
                        <span>Final Amount Due (at dispatch):</span>
                        <span className="font-mono">₹{remainingBalance.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/15 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Generating Receipt..." : "Finalize Order & Book Outfits"}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BEAUTIFUL STATE-BASED CONFIRMATION DIALOG */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setConfirmModal(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 animate-slide-up space-y-4 z-10 text-center animate-slide-up">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.isDanger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">{confirmModal.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-3 py-2 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED DISPATCH & PAYMENT CHECKS MODAL */}
      {dispatchModal?.isOpen && (() => {
        const gstAmount = dispatchModal.booking.invoiceType === "GST" && settings?.gstEnabled ? Math.round(dispatchModal.booking.totalRent * 0.18) : 0;
        const finalAmount = dispatchModal.booking.totalRent + dispatchModal.booking.securityDeposit + gstAmount - dispatchModal.booking.discount;
        const currentPaid = dispatchModal.booking.advanceAmount;
        const enteredDispatchPayment = Number(dispatchModal.paymentInput) || 0;
        const totalPayments = currentPaid + enteredDispatchPayment;
        const isMatch = totalPayments === finalAmount;
        const difference = finalAmount - totalPayments;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div onClick={() => setDispatchModal(null)} className="absolute inset-0 cursor-pointer" />
            <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full overflow-hidden animate-slide-up z-10">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">Verified Dispatch Gateway</h3>
                    <p className="text-[10px] text-slate-500 font-mono">BOOKING ID: {dispatchModal.booking.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchModal(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                {/* Customer Banner */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 block uppercase tracking-wider">Customer Profile</span>
                    <span className="font-bold text-slate-800">{dispatchModal.booking.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[9px] text-slate-400 block uppercase tracking-wider">Mobile Contact</span>
                    <span className="font-mono text-slate-600 font-semibold">{dispatchModal.booking.customerMobile}</span>
                  </div>
                </div>

                {/* Financial Ledger Details */}
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Final Amount Calculator</span>
                  
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600">
                    <div>Total Rent ({dayjs(dispatchModal.booking.returnDate).diff(dayjs(dispatchModal.booking.rentalStartDate), "day")} days):</div>
                    <div className="text-right font-mono font-bold text-slate-800">₹{dispatchModal.booking.totalRent.toLocaleString("en-IN")}</div>

                    <div>Security Deposit:</div>
                    <div className="text-right font-mono font-bold text-slate-800">₹{dispatchModal.booking.securityDeposit.toLocaleString("en-IN")}</div>

                    {gstAmount > 0 && (
                      <>
                        <div>GST Taxes (18%):</div>
                        <div className="text-right font-mono font-bold text-slate-800">₹{gstAmount.toLocaleString("en-IN")}</div>
                      </>
                    )}

                    {dispatchModal.booking.discount > 0 && (
                      <>
                        <div className="text-rose-600">Applied Discount:</div>
                        <div className="text-right font-mono font-bold text-rose-600">-₹{dispatchModal.booking.discount.toLocaleString("en-IN")}</div>
                      </>
                    )}

                    <div className="text-emerald-600 font-semibold">Advance Payment Received:</div>
                    <div className="text-right font-mono font-semibold text-emerald-600">-₹{currentPaid.toLocaleString("en-IN")}</div>

                    <div className="border-t border-dashed border-slate-200 pt-2 font-black text-slate-900 text-sm">Final Amount Due:</div>
                    <div className="border-t border-dashed border-slate-200 pt-2 text-right font-mono font-black text-slate-900 text-sm">
                      ₹{(finalAmount - currentPaid).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Payments Reconciliation */}
                <div className="space-y-3.5">
                  <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Payments Reconciliation</span>

                  {/* Advance Amount Paid Badge */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">1. Advance Payment Received:</span>
                    <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      ₹{currentPaid.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Input field for dispatch amount */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      2. Manually Enter Received Amount at Dispatch:
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-400 text-xs font-bold">₹</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Type received amount"
                        value={dispatchModal.paymentInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDispatchModal({
                            ...dispatchModal,
                            paymentInput: val,
                            error: null
                          });
                        }}
                        className="block w-full rounded-lg border border-slate-200 py-2.5 pl-7 pr-3 text-xs font-mono font-bold text-slate-800 focus:border-primary-500 focus:ring-primary-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Real-time calculated status banner */}
                  <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-slate-900">
                      <span>Total Payments (1 + 2):</span>
                      <span className="font-mono text-base">₹{totalPayments.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="mt-2.5">
                      {isMatch ? (
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 p-2.5 rounded-lg flex items-center space-x-2 text-[10px] font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Ledger Cleared! Total payments match the Final Amount perfectly. Ready to Dispatch.</span>
                        </div>
                      ) : (
                        <div className="bg-rose-50 text-rose-700 border border-rose-200/60 p-2.5 rounded-lg flex items-start space-x-2 text-[10px] font-medium leading-relaxed">
                          <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            {difference > 0 ? (
                              <span>Outstanding Balance Remaining: <strong className="font-bold">₹{difference.toLocaleString("en-IN")}</strong>. Dispatch requires the balance to be fully cleared!</span>
                            ) : (
                              <span>Excess Payment Received: <strong className="font-bold">₹{Math.abs(difference).toLocaleString("en-IN")}</strong>. Total payments must match the exact final amount!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Banner inside modal */}
                {dispatchModal.error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-[10px] font-semibold leading-relaxed">
                    ⚠️ {dispatchModal.error}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDispatchModal(null)}
                  className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer text-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDispatchAction}
                  disabled={!isMatch || isSubmitting}
                  className={`py-2.5 text-white font-bold rounded-lg text-xs cursor-pointer text-center transition-all ${
                    isMatch && !isSubmitting
                      ? "bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/10"
                      : "bg-slate-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Confirm & Dispatch / OUT"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* "WHAT'S NEXT" SUCCESS WORKFLOW MODAL */}
      {whatsNextModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setWhatsNextModal(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-8 animate-slide-up space-y-6 z-10 text-left">
            <div className="text-center space-y-2.5">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-slate-900 text-base tracking-tight">Booking Dispatched Successfully!</h3>
                <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Order Reference: {whatsNextModal.booking.id}</p>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-3">
              <span className="font-bold text-[9px] font-mono text-slate-400 block uppercase tracking-wider">Operator Action Guide • What to do next?</span>
              
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                  <p className="text-[11px] leading-relaxed">
                    <strong className="text-slate-900">Manage returns on the Returns tab:</strong> When the client's rental period ends (on <strong className="text-slate-900">{whatsNextModal.booking.returnDate}</strong>), switch to the <strong>Returns Manager</strong> to process the asset condition audit, charge for any damages, and clear security deposits.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                  <p className="text-[11px] leading-relaxed">
                    <strong className="text-slate-900">Notify the client on WhatsApp:</strong> Send a quick dispatch confirmation receipt to the customer's phone number (<strong className="text-slate-900">+91 {whatsNextModal.booking.customerMobile}</strong>).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWhatsNextModal(null);
                  if (setCurrentTab) setCurrentTab("returns");
                }}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/15 cursor-pointer transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Navigate to Returns Manager</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getWhatsAppMessage(whatsNextModal.booking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsNextModal(null)}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center space-x-1 text-center"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </a>
                
                <button
                  type="button"
                  onClick={() => setWhatsNextModal(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Stay on Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
