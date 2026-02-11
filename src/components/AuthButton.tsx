"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";

import { useSelector } from "react-redux";
import ProfileIcon from "./ProfileIcon";

export default function AuthButton() {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  if (isAuthenticated && user) {
    return <ProfileIcon />;
  }

  return (
    <div className="flex items-center gap-3">
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
    </div>
  );
}
