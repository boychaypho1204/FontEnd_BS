import React from "react";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant h-16 px-6 flex items-center w-full">
      <div className="flex items-center gap-4">
        {/* Nút Menu chỉ hiện trên giao diện điện thoại/tablet */}
        <button className="md:hidden text-on-surface">
          <Menu size={24} />
        </button>

        {/* Chỉ hiển thị chữ Admin kèm theo tên trang (title) */}
        <h1 className="text-xl font-bold text-on-surface">
          {title ? ` ${title}` : ""}
        </h1>
      </div>
    </header>
  );
}
