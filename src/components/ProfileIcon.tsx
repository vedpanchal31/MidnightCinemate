"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Ticket, LogOut } from "lucide-react";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSelector } from "react-redux";
import useLogout from "@/hooks/uselogout";

export default function ProfileIcon() {
  const { logout } = useLogout();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  if (isAuthenticated && user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-zinc-700 hover:border-primary transition-colors focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex h-full w-full items-center justify-center bg-zinc-800">
              <User className="h-5 w-5 text-zinc-300" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 bg-zinc-900 border-zinc-800 text-white p-4 shadow-xl shadow-black/50"
          align="end"
        >
          <div className="grid gap-4">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-sm font-semibold leading-none truncate">
                  {user.name || "User"}
                </h4>
                <p className="text-xs text-zinc-400 break-all truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="grid gap-1">
              <Link
                href="/transactions"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
              >
                <Ticket className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors" />
                My Transactions
              </Link>

              <Button
                variant="destructive"
                size="sm"
                className="w-full flex items-center justify-center gap-2 mt-2 bg-red-950/30 text-red-400 hover:bg-red-950/50 border border-red-900/50 transition-colors"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return null; // Don't show anything if not authenticated
}
