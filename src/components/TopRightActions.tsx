"use client";

import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import NotificationIcon from "@/components/NotificationIcon";
import ProfileIcon from "@/components/ProfileIcon";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TopRightActions() {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  return (
    <div className="fixed right-4 top-4 z-[100] flex items-center gap-3">
      {isAuthenticated && user ? (
        <>
          <ProfileIcon />
          <NotificationIcon />
        </>
      ) : (
        <>
          <Link href="/login">
            <Button
              variant="outline"
              className="bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-500"
            >
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105">
              Sign Up
            </Button>
          </Link>
        </>
      )}
      <ThemeToggle />
    </div>
  );
}
