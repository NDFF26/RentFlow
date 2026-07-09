/**
 * RentFlow Activity Logs Audit Component
 * Chronicles real-time warehouse dispatches, profile creations,
 * tariff alterations, and status overrides for absolute security compliance.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { toast } from "react-hot-toast";
import { Shield, Search, RefreshCw, Clock } from "lucide-react";
import dayjs from "dayjs";

export const ActivityLogs: React.FC = () => {
  const { logs } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Audit trail synchronized.");
    }, 400);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !moduleFilter || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
              Audit Trails & Security Logs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of every system transaction, stock change, invoice dispatch, and pricing modification.
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search logs by staff name, role, event description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors placeholder:text-slate-400"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary-600 focus:outline-hidden rounded-lg transition-colors cursor-pointer text-slate-600 bg-white"
        >
          <option value="">All Functional Modules</option>
          <option value="Dashboard">Dashboard Overview</option>
          <option value="Categories">Categories Manager</option>
          <option value="Inventory">Inventory Warehouse</option>
          <option value="Bookings">Rental Calendar</option>
          <option value="Returns">Returns & Condition Audit</option>
          <option value="Customers">Customers Directory</option>
          <option value="Staff Portal">Staff Accounts Console</option>
          <option value="Settings">Branding Configurator</option>
        </select>
      </div>

      {/* LOGS TABLE SHEET */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Stamp Date / Time</th>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">System Event Log</th>
                <th className="p-4 text-right pr-6">Source Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 pl-6 text-slate-500 font-mono whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dayjs(log.timestamp).format("DD-MMM-YYYY")}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {dayjs(log.timestamp).format("hh:mm A")}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {log.userId}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      log.role === "Admin" ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-700 leading-relaxed block max-w-lg">{log.action}</span>
                    {log.referenceId && (
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Target Ref ID: {log.referenceId}</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-6 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold font-mono">
                      {log.module}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-mono text-xs">
                    No activity logs fit these query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
