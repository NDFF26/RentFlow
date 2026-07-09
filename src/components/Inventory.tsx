/**
 * RentFlow Inventory Management Component
 * Implements SKU uniqueness controls, rental tariff configuration,
 * warehouse balances (Available vs. Booked vs. Out), and archival.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, Search, X, PackageOpen, Eye, Hammer, RefreshCw } from "lucide-react";
import { InventoryItem, ItemStatus, UserRole } from "../types";

export const Inventory: React.FC = () => {
  const { items, categories, currentUser } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [rentPrice, setRentPrice] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.AVAILABLE);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddMode = () => {
    setEditingItem(null);
    setViewingItem(null);
    setSku("");
    setItemName("");
    setCategoryId(categories[0]?.id || "");
    setDescription("");
    setRentPrice(100);
    setSecurityDeposit(500);
    setQuantity(1);
    setImageUrl("https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop&q=80");
    setStatus(ItemStatus.AVAILABLE);
    setIsDrawerOpen(true);
  };

  const openEditMode = (item: InventoryItem) => {
    setViewingItem(null);
    setEditingItem(item);
    setSku(item.sku);
    setItemName(item.itemName);
    setCategoryId(item.categoryId);
    setDescription(item.description);
    setRentPrice(item.rentPrice);
    setSecurityDeposit(item.securityDeposit);
    setQuantity(item.quantity);
    setImageUrl(item.imageUrl);
    setStatus(item.status);
    setIsDrawerOpen(true);
  };

  const openViewMode = (item: InventoryItem) => {
    setViewingItem(item);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !itemName.trim()) {
      toast.error("SKU Code and Item Name are mandatory.");
      return;
    }
    if (rentPrice < 0 || securityDeposit < 0) {
      toast.error("Rent Price and Security Deposit cannot be negative.");
      return;
    }
    if (quantity < 1) {
      toast.error("Total stock quantity must be at least 1.");
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    if (!selectedCat) {
      toast.error("Please assign a valid category.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update
        await dbService.updateItem(editingItem.id, {
          sku: sku.trim().toUpperCase(),
          itemName: itemName.trim(),
          categoryId,
          categoryName: selectedCat.categoryName,
          description: description.trim(),
          rentPrice,
          securityDeposit,
          quantity,
          imageUrl: imageUrl.trim(),
          status,
          updatedBy: currentUser?.id || "unknown"
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Updated Inventory Item: ${sku.toUpperCase()}`, "Inventory", editingItem.id);
        }
        toast.success("Inventory records updated successfully.");
      } else {
        // Create
        const newItem = await dbService.createItem({
          sku: sku.trim().toUpperCase(),
          itemName: itemName.trim(),
          categoryId,
          categoryName: selectedCat.categoryName,
          description: description.trim(),
          rentPrice,
          securityDeposit,
          quantity,
          imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop&q=80",
          status: ItemStatus.AVAILABLE,
          createdBy: currentUser?.id || "unknown",
          updatedBy: currentUser?.id || "unknown"
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Added New Inventory SKU: ${sku.toUpperCase()}`, "Inventory", newItem.id);
        }
        toast.success("New Item registered in warehouse catalog.");
      }
      setIsDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save inventory profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    // Only Admin is allowed to trigger soft archives
    if (currentUser?.role !== UserRole.ADMIN) {
      toast.error("Archival permissions restricted to administrator level.");
      return;
    }

    setDeletingItem(item);
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem || !currentUser) return;
    try {
      await dbService.archiveItem(deletingItem.id);
      await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Archived/Deleted Inventory SKU: ${deletingItem.sku}`, "Inventory", deletingItem.id);
      toast.success("Item archived successfully from catalogs.");
    } catch (err: any) {
      toast.error(err.message || "Archive operation failed.");
    } finally {
      setDeletingItem(null);
    }
  };

  // Move item directly to maintenance or active status
  const toggleMaintenance = async (item: InventoryItem) => {
    try {
      const isMaint = item.status === ItemStatus.MAINTENANCE;
      const targetStatus = isMaint ? ItemStatus.AVAILABLE : ItemStatus.MAINTENANCE;
      const patch: Partial<InventoryItem> = {
        status: targetStatus,
        maintenanceQuantity: isMaint ? 0 : 1
      };
      await dbService.updateItem(item.id, patch);
      toast.success(isMaint ? `${item.sku} returned to Available storage.` : `${item.sku} dispatched to Maintenance workshop.`);
    } catch (err: any) {
      toast.error(err.message || "Status change failed.");
    }
  };

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !catFilter || i.categoryId === catFilter;
    const matchesStatus = !statusFilter || i.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Rental Inventory Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain SKU stock counts, rent rates, security deposits, and physically check workshop allocations.
          </p>
        </div>
        <button
          onClick={openAddMode}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Inventory Item</span>
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search SKU code, item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Category filter */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors cursor-pointer text-slate-600"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.categoryName}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors cursor-pointer text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value={ItemStatus.AVAILABLE}>Available</option>
          <option value={ItemStatus.BOOKED}>Booked</option>
          <option value={ItemStatus.OUT}>Out (Customer)</option>
          <option value={ItemStatus.MAINTENANCE}>Maintenance</option>
          <option value={ItemStatus.LOST}>Lost</option>
        </select>
      </div>

      {/* INVENTORY TABLE CARD */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">SKU Code</th>
                <th className="p-4">Item Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Rent/Day</th>
                <th className="p-4">Deposit</th>
                <th className="p-4">Storage (Avail/Book/Out)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-slate-900">{item.sku}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3 max-w-sm">
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{item.itemName}</span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{item.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">{item.categoryName}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">₹{item.rentPrice.toLocaleString("en-IN")}</td>
                  <td className="p-4 font-mono text-slate-500">₹{item.securityDeposit.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="font-mono font-semibold text-slate-700">
                        {item.availableQuantity} available <span className="text-slate-300">/</span> {item.quantity} total
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                        <span className="text-blue-500">{item.bookedQuantity} Bkd</span>
                        <span>•</span>
                        <span className="text-amber-500">{item.outQuantity} Out</span>
                        {item.maintenanceQuantity > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-500">{item.maintenanceQuantity} Maint</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                      item.status === ItemStatus.AVAILABLE ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      item.status === ItemStatus.BOOKED ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      item.status === ItemStatus.OUT ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      item.status === ItemStatus.MAINTENANCE ? "bg-purple-50 text-purple-700 border border-purple-100" :
                      "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6 space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openViewMode(item)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer inline-flex"
                      title="Quick View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditMode(item)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex"
                      title="Edit Item Specs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMaintenance(item)}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer inline-flex ${
                        item.status === ItemStatus.MAINTENANCE
                          ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                          : "hover:bg-slate-100 text-slate-400 hover:text-purple-600"
                      }`}
                      title="Toggle Maintenance Status"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex"
                      title="Archive SKU"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto space-y-3">
                      <PackageOpen className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">No Inventory Items Found</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Please check search query filters or register a new SKU item.</p>
                      </div>
                      <button
                        onClick={openAddMode}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Register New SKU
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED VIEW MODAL OVERLAY */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setViewingItem(null)} className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up z-10">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-mono font-bold text-slate-700 text-xs">SKU Record: {viewingItem.sku}</span>
              <button onClick={() => setViewingItem(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex space-x-4">
                <img
                  src={viewingItem.imageUrl}
                  alt={viewingItem.itemName}
                  className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{viewingItem.categoryName}</span>
                  <h3 className="font-display font-bold text-slate-900 text-base mt-1.5 leading-tight">{viewingItem.itemName}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{viewingItem.description || "No desc assigned."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Rent Rate</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{viewingItem.rentPrice.toLocaleString("en-IN")} / Day</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Security Deposit</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{viewingItem.securityDeposit.toLocaleString("en-IN")} (Refundable)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Warehouse Allocations</span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 block uppercase">Total</span>
                    <span className="font-bold text-slate-800">{viewingItem.quantity}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-[9px] text-emerald-500 block uppercase">Avail</span>
                    <span className="font-bold text-emerald-700">{viewingItem.availableQuantity}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span className="text-[9px] text-blue-500 block uppercase">Bkd</span>
                    <span className="font-bold text-blue-700">{viewingItem.bookedQuantity}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <span className="text-[9px] text-amber-500 block uppercase">Out</span>
                    <span className="font-bold text-amber-700">{viewingItem.outQuantity}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SLIDEOUT DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-display font-bold text-slate-800 text-sm">
                  {editingItem ? `Edit SKU Specs: ${editingItem.sku}` : "Add New Item"}
                </span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      SKU Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., SHRW-001"
                      disabled={!!editingItem} // SKU is unmodifiable once created to preserve relational mappings
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors uppercase disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Category Assignment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors cursor-pointer text-slate-700 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full descriptive product name..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    Product Description
                  </label>
                  <textarea
                    placeholder="Details about style, sizes, fits, camera lenses compatible..."
                    value={description}
                    rows={3}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Rent Tariff / Day (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rentPrice}
                      onChange={(e) => setRentPrice(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Refundable Deposit (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Total Stock Owned <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      Physical Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="Https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                {editingItem && (
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      Change Status State
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ItemStatus)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors cursor-pointer text-slate-700 bg-white"
                    >
                      <option value={ItemStatus.AVAILABLE}>Available</option>
                      <option value={ItemStatus.MAINTENANCE}>Maintenance</option>
                      <option value={ItemStatus.LOST}>Lost / Scrap</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary-600 text-white hover:bg-primary-700 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : editingItem ? "Apply Changes" : "Register Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STATE-BASED CONFIRMATION DIALOG */}
      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setDeletingItem(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 z-10 text-center animate-slide-up">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">Archive / Delete Item</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Are you absolutely sure you want to permanently delete/archive Item <strong className="font-semibold text-slate-800">"{deletingItem.itemName}"</strong> ({deletingItem.sku})? This cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
