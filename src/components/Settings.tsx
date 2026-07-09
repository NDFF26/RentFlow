/**
 * RentFlow Settings & Company Branding Portal
 * Accessible by Admin users. Displays branding logos, tax numbers,
 * invoice codes, and address headers. Brand settings are managed in code.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Settings as SettingsIcon, Store, Receipt, Lock, Info } from "lucide-react";
import { BRAND_CONFIG } from "../brandConfig";

export const Settings: React.FC = () => {
  const { settings } = useApp();

  // Settings states from BRAND_CONFIG
  const companyName = BRAND_CONFIG.companyName;
  const companyLogo = BRAND_CONFIG.companyLogo;
  const phone = BRAND_CONFIG.phone;
  const email = BRAND_CONFIG.email;
  const whatsAppNumber = BRAND_CONFIG.whatsAppNumber;
  const invoicePrefix = BRAND_CONFIG.invoicePrefix;
  const gstEnabled = BRAND_CONFIG.gstEnabled;
  const gstNumber = BRAND_CONFIG.gstNumber;
  const businessAddress = BRAND_CONFIG.businessAddress;
  const businessDescription = BRAND_CONFIG.businessDescription;

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            Company Branding & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Branding settings for printouts, tax invoices, customer support, and system prefixes.
          </p>
        </div>
      </div>

      {/* SYSTEM BRANDING NOTIFICATION PANEL */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 font-display">Branding Managed via System Config</h4>
          <p className="text-[11px] text-amber-700 leading-relaxed mt-1">
            To prevent accidental overrides, Company Name, Logo, Address, and Invoice codes are updated directly in the codebase.
            Edit the <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-[10px]">/src/brandConfig.ts</code> file in the code editor to apply changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - BUSINESS CARDS SPECIFICATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SEC 01: Core details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-3">
              <Store className="w-4.5 h-4.5 text-primary-600 mr-2" />
              Primary Store Details (Read-Only)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Brand / Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={companyName}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-medium cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Company Logo URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={companyLogo}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Helpline Mobile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-mono cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Helpline Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-mono cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  WhatsApp Contact API
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={whatsAppNumber}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-mono cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                Full Physical Warehouse Address
              </label>
              <div className="relative">
                <textarea
                  disabled
                  value={businessAddress}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed resize-none leading-relaxed pr-10"
                />
                <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                Business Description
              </label>
              <div className="relative">
                <textarea
                  disabled
                  value={businessDescription}
                  rows={2}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed resize-none leading-relaxed pr-10"
                />
                <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* SEC 02: Ledger options */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-3">
              <Receipt className="w-4.5 h-4.5 text-primary-600 mr-2" />
              Taxing & Invoice Options (Read-Only)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Invoice Code Prefix
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={invoicePrefix}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-mono font-bold uppercase cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Invoice Currency Format
                </label>
                <input
                  type="text"
                  disabled
                  value={`${BRAND_CONFIG.currency} INR`}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">GST Tax Billing</span>
                  <span className="text-[11px] text-slate-400 block font-sans">Enable generation of GST Invoice Receipts containing SGST/CGST rates.</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="gstToggle"
                    disabled
                    checked={gstEnabled}
                    className="sr-only"
                  />
                  <label
                    htmlFor="gstToggle"
                    className={`block w-11 h-6 rounded-full cursor-not-allowed transition-all ${
                      gstEnabled ? "bg-primary-600/60" : "bg-slate-200"
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 mt-1 shadow-xs ${
                      gstEnabled ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </label>
                </div>
              </div>

              {gstEnabled && (
                <div className="animate-slide-up">
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                    GSTIN Registration Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={gstNumber}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg font-mono uppercase cursor-not-allowed pr-10"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-3.5" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - BRAND PREVIEW & SUMMARY ACTIONS */}
        <div className="space-y-6">
          {/* Card 01: Fast Brand Preview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs text-center space-y-4">
            <span className="font-bold text-[10px] font-mono text-slate-400 block uppercase tracking-wider text-left">Brand Layout Preview</span>
            
            <div className="flex flex-col items-center py-5 border border-slate-100 rounded-xl bg-slate-50/50">
              <img
                src={companyLogo || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100&h=100&fit=crop&q=80"}
                alt="Logo Preview"
                className="w-16 h-16 object-cover rounded-2xl border border-slate-200 shadow-xs"
              />
              <span className="font-display font-bold text-slate-900 text-sm mt-3 block">{companyName}</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{invoicePrefix}-YYYYMMDD-XXXX</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Company logo and prefix will reflect in all dispatches, calendar entries, and A4 invoice printed files.
            </p>
          </div>

          {/* Form Locked button block */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <button
              type="button"
              disabled
              className="w-full py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>System Branding Locked</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 font-sans">
              To update settings, edit the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px] text-slate-600">/src/brandConfig.ts</code> file.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
