/**
 * RentFlow Staff Management Portal Component
 * Accessible to Admin operators only. Handles creation of sales representatives,
 * credential management, and status suspension.
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { dbService } from "../services/db";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2, X, ShieldAlert, UserCheck, Check, Ban, EyeOff } from "lucide-react";
import { AppUser, UserRole, UserStatus } from "../types";

export const Staff: React.FC = () => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.SALES_PERSON);
  const [profileImage, setProfileImage] = useState("");
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const uList = await dbService.getUsers();
      setUsers(uList);
    } catch (e) {
      toast.error("Failed to load staff list.");
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setRole(UserRole.SALES_PERSON);
    setProfileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80");
    setStatus(UserStatus.ACTIVE);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (u: AppUser) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setProfileImage(u.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80");
    setStatus(u.status);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("All credentials are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update
        const updated = await dbService.updateUser(editingUser.id, {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          profileImage,
          status
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Modified Staff Card for ${fullName}`, "Staff Portal", editingUser.id);
        }
        toast.success("Staff profile updated successfully.");
      } else {
        // Create
        const created = await dbService.createUser({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          profileImage,
          status
        });
        if (currentUser) {
          await dbService.logActivity(currentUser.id, currentUser.fullName, currentUser.role, `Registered New Staff Member: ${fullName}`, "Staff Portal", created.id);
        }
        toast.success("New Staff registration completed.");
      }
      setIsDrawerOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot deactivate or suspend your own operational session.");
      return;
    }

    const nextStatus = user.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE;
    try {
      await dbService.updateUser(user.id, { status: nextStatus });
      toast.success(`User access set as ${nextStatus}.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to switch status.");
    }
  };

  const handleDeleteUser = async (u: AppUser) => {
    if (u.id === currentUser?.id) {
      toast.error("You cannot delete your own administrative file.");
      return;
    }

    setDeletingUser(u);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await dbService.deleteUser(deletingUser.id);
      toast.success("Staff account deleted from systems.");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed.");
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Staff Portal & Access Levels
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin console to create sales representatives, reset temporary session keys, and toggle active logins.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Staff Profile</span>
        </button>
      </div>

      {/* STAFF CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              {/* Profile Block */}
              <div className="flex items-center space-x-3.5">
                <img
                  src={u.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80"}
                  alt={u.fullName}
                  className="w-14 h-14 rounded-full object-cover border border-slate-100"
                />
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">{u.fullName}</h3>
                  <span className={`inline-block px-2 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider mt-1 ${
                    u.role === UserRole.ADMIN ? "bg-purple-50 text-purple-700 border border-purple-100" :
                    u.role === UserRole.MANAGER ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>

              {/* Contact Credentials */}
              <div className="space-y-1.5 text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Registered Email:</span>
                  <span className="text-slate-800 font-mono text-[11px]">{u.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Mobile:</span>
                  <span className="text-slate-800 font-mono text-[11px]">{u.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Login Privileges:</span>
                  <span className={`font-semibold inline-flex items-center ${u.status === UserStatus.ACTIVE ? "text-emerald-600" : "text-rose-500"}`}>
                    {u.status === UserStatus.ACTIVE ? <UserCheck className="w-3.5 h-3.5 mr-0.5" /> : <EyeOff className="w-3.5 h-3.5 mr-0.5" />}
                    {u.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-100 p-3.5 flex justify-end space-x-1">
              <button
                onClick={() => handleToggleStatus(u)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-colors inline-flex items-center space-x-1 ${
                  u.status === UserStatus.ACTIVE
                    ? "bg-white border-rose-100 text-rose-600 hover:bg-rose-50"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                }`}
              >
                {u.status === UserStatus.ACTIVE ? (
                  <>
                    <Ban className="w-3 h-3 mr-0.5" />
                    <span>Suspend Session</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-0.5" />
                    <span>Enable Login</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleOpenEdit(u)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center"
              >
                <Edit2 className="w-3 h-3 mr-0.5" />
                <span>Modify Details</span>
              </button>
              <button
                onClick={() => handleDeleteUser(u)}
                className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer inline-flex"
                title="Delete User"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATION DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-up">
            <div>
              {/* Header */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-display font-bold text-slate-800 text-sm">
                  {editingUser ? "Edit User Properties" : "Register Team Associate"}
                </span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Devendra Singh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Email Login ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="E.g., devendra@rentflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      Operational Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden bg-white"
                    >
                      <option value={UserRole.SALES_PERSON}>Sales Person</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      Session Password Hint
                    </label>
                    <input
                      type="text"
                      disabled
                      value={role === UserRole.ADMIN ? "admin123" : role === UserRole.MANAGER ? "manager123" : "sales123"}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5">
                    Profile Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-primary-600 focus:outline-hidden transition-colors"
                  />
                </div>
              </form>
            </div>

            {/* Footer Buttons */}
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
                {isSubmitting ? "Finalizing..." : editingUser ? "Apply Edits" : "Complete Registration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STATE-BASED CONFIRMATION DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div onClick={() => setDeletingUser(null)} className="absolute inset-0 cursor-pointer" />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 space-y-4 z-10 text-center animate-slide-up">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">Delete Staff Profile</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Are you absolutely sure you want to delete staff account <strong className="font-semibold text-slate-800">"{deletingUser.fullName}"</strong>? This will revoke all platform access.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
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
