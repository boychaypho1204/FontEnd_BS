import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useEffect(() => {
    document.body.classList.add("admin-page");

    return () => {
      document.body.classList.remove("admin-page");
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[280px] overflow-hidden">
        <Header title="Admin" />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1440px] mx-auto">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
