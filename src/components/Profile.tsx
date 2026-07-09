/**
 * RentFlow Operator Profile & License verification component
 * Displays current session details, account credentials,
 * and high-contrast licensing terms.
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { ShieldAlert, Award, Star, KeyRound, Clock, HeartHandshake } from "lucide-react";

export const Profile: React.FC = () => {
  const { currentUser, settings } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-slide-up">
      {/* PROFILE HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-600 via-primary-700 to-slate-900" />
        
        {/* Profile Content */}
        <div className="relative px-6 pb-6 pt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between sm:space-x-5">
          <div className="absolute -top-12 left-6">
            <img
              src={currentUser?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80"}
              alt={currentUser?.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center">
              {currentUser?.fullName}
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 ml-2" />
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Active Operator at <span className="font-bold text-slate-700">{settings?.companyName}</span>
            </p>
          </div>

          <div className="mt-4 sm:mt-0 shrink-0">
            <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-primary-50 text-primary-700 border border-primary-100">
              {currentUser?.role} Status
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Column 1: Profile Credentials Form/List (Cols 3) */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-display font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-3">
            <KeyRound className="w-4.5 h-4.5 text-primary-600 mr-2" />
            Session Credentials
          </h3>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">OPERATOR FULL NAME</span>
              <input
                type="text"
                disabled
                value={currentUser?.fullName || "Operator Agent"}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">OPERATOR EMAIL LOGIN ID</span>
                <input
                  type="text"
                  disabled
                  value={currentUser?.email || ""}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">CONTACT PHONE</span>
                <input
                  type="text"
                  disabled
                  value={currentUser?.phone || ""}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">SESSION LEVEL POLICY</span>
              <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
                Your role carries complete <span className="font-bold text-slate-700">{currentUser?.role}</span> system level authorization. Sub-ledger approvals, category additions, and stock deletions are governed by this profile token.
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Licensing details (Cols 2) */}
        <div className="md:col-span-2 space-y-6">
          {/* COMMERCIAL LICENSE VERIFICATION */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-display font-black text-xs tracking-wider flex items-center text-primary-400">
                  <Award className="w-4.5 h-4.5 mr-1.5 text-primary-500" />
                  RENTFLOW PRO LICENSE
                </span>
                <span className="px-2 py-0.5 rounded-sm text-[8px] bg-primary-600 font-bold uppercase tracking-widest text-white">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">SaaS Level:</span>
                  <span className="font-bold">Enterprise Corporate Suite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Serial Token:</span>
                  <span className="font-mono text-primary-400 font-bold text-[10px]">RF-PRO-88C9-2B05</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Active Warehouses:</span>
                  <span className="font-bold">1 Center (Mumbai Primary)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Support Desk:</span>
                  <span className="font-bold text-primary-300">24/7 Priority SLA</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-start space-x-2 text-[10px] text-slate-400 leading-relaxed">
              <Clock className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
              <span>
                License subscription auto-extends on a standard monthly grace. Active operator billing accounts are verified in real time.
              </span>
            </div>
          </div>

          {/* SLA HELP DESK CARD */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5 text-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">RentFlow Support Desk</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Facing an operational query or stock mismatch? Touch base with your technical team at <span className="font-bold text-slate-700">velocityptc@gmail.com</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
