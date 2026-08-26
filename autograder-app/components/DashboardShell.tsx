"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, FileQuestion, BookOpen, Users, Settings, Menu, X, Search, Bell, HelpCircle } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/soal", label: "My Exams", icon: FileQuestion },
  { href: "/question-bank", label: "Question Bank", icon: BookOpen },
  { href: "/submissions", label: "Submissions", icon: Users },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <nav className={`h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="px-6 py-8 flex items-center justify-between border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-blue-700 tracking-tight">EduPortal</h1>
            <p className="text-xs text-slate-500">Faculty Dashboard</p>
          </div>
          <button className="md:hidden text-slate-500 hover:text-blue-600 p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors group">
                <Icon className="w-5 h-5 group-hover:text-blue-600" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors group mt-auto">
            <Settings className="w-5 h-5 group-hover:text-blue-600" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 w-full md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex justify-between items-center h-16 px-4 md:px-10">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-500 hover:text-blue-600 p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-semibold text-slate-800 tracking-tight">Exam Manager</span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100">
                <Search className="w-5 h-5" />
              </button>
              <button className="hidden sm:flex text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100">
                <Bell className="w-5 h-5" />
              </button>
              <button className="hidden sm:flex text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0" />
            </div>
          </div>
        </header>

        {/* Page content offset by header height */}
        <div className="flex-1 pt-16 pb-20 md:pb-0">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600">
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
