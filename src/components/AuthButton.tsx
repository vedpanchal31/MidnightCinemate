"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export default function AuthButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Replace with actual auth state

  const handleLogout = () => {
    setIsLoggedIn(false);
    // TODO: Implement actual logout logic
  };

  if (isLoggedIn) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800/50"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Account</span>
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-zinc-400">john@example.com</p>
            </div>
            <div className="p-2">
              <Link href="/profile" className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md">
                Profile
              </Link>
              <Link href="/bookings" className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md">
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login">
        <Button variant="outline" className="bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800/50">
          Login
        </Button>
      </Link>
      <Link href="/signup">
        <Button className="bg-primary hover:bg-primary/90 text-white">
          Sign Up
        </Button>
      </Link>
    </div>
  );
}
