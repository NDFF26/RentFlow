/**
 * RentFlow Categories Management Component
 * Allows creating, updating, disabling, and safely deleting catalog categories.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, FolderPlus, HelpCircle, X, Check, EyeOff, Search } from "lucide-react";
import { Category } from "../types";

export const Categories: React.FC = () => {
  const { categories, currentUser } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Disabled">("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddMode = () => {
    setEditingCategory(null);
    setCategoryName("");
    setDescription("");
    setStatus("Active");
    setIsDrawerOpen(true);
  };

  const openEditMode = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.categoryName);
    setDescription(cat.description);
    setStatus(cat.status);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update Mode
        await dbService.updateCategory(editingCategory.id, {
          categoryName: categoryName.trim(),
          description: description.trim(),
          status
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Updated Category "${categoryName}"`, "Categories", editingCategory.id);
        }
        toast.success("Category updated successfully.");
      } else {
        // Add Mode
        const newCat = await dbService.createCategory({
          categoryName: categoryName.trim(),
          description: description.trim(),
          status
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Created Category "${categoryName}"`, "Categories", newCat.id);
        }
        toast.success("New Category added to catalog.");
      }
      setIsDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    setDeletingCategory(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await dbService.deleteCategory(deletingCategory.id);
      if (currentUser) {
        await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Deleted Category "${deletingCategory.categoryName}"`, "Categories", deletingCategory.id);
      }
      toast.success("Category deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Could not delete category.");
    } finally {
      setDeletingCategory(null);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Inventory Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Group rental inventory items to organize the booking catalog and filter stock reports.
          </p>
        </div>
        <button
          onClick={openAddMode}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Category</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search categories by name or descriptive content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* CATEGORIES TABLE CARD */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Category Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-slate-800">{cat.categoryName}</td>
                  <td className="p-4 text-slate-500 max-w-sm truncate">{cat.description || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                      cat.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}>
                      {cat.status === "Active" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500 mr-0.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-400 mr-0.5" />
                          <span>Disabled</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6 space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditMode(cat)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex"
                      title="Edit Category Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto space-y-3">
                      <FolderPlus className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">No Categories Found</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">We could not find any matching category records in your database.</p>
                      </div>
                      <button
                        onClick={openAddMode}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Create your first Category
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER SLIDE-IN SHELL FOR ADD / EDIT FORM */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs animate-fade-in"
          />

          {/* Form Content panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div>
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-display font-bold text-slate-800 text-sm">
                  {editingCategory ? "Update Catalog Category" : "Create New Category"}
                </span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Designer Gowns, Camera Lenses"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Category Description
                  </label>
                  <textarea
                    placeholder="Brief description of catalog inclusions under this grouping..."
                    value={description}
                    rows={4}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Availability Status
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setStatus("Active")}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        status === "Active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Active Group
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("Disabled")}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        status === "Disabled"
                          ? "bg-slate-100 text-slate-700 border-slate-300 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Disabled Group
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Disabling a category temporarily hides it from fast creation selector feeds.</p>
                </div>
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex space-x-2">
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
                {isSubmitting ? "Processing..." : editingCategory ? "Save Modifications" : "Add to Catalog"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STATE-BASED CONFIRMATION DIALOG */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setDeletingCategory(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 z-10 text-center animate-slide-up">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">Delete Category</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Are you absolutely sure you want to delete Category <strong className="font-semibold text-slate-800">"{deletingCategory.categoryName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
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
