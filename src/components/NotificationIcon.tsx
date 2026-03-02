"use client";

import React from "react";
import { Bell } from "lucide-react";

export default function NotificationIcon() {
  return (
    <button
      type="button"
      className="relative p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
      <span className="sr-only">Notifications</span>
    </button>
  );
}
