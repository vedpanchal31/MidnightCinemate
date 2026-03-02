"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import {
  notificationsApi,
  useGetUnreadCountQuery,
} from "@/store/notificationsApi";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSocket, disconnectSocket } from "@/lib/socket/client";

export default function NotificationIcon() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const { data: unreadCount = 0, refetch } = useGetUnreadCountQuery(
    { user_id: user?.id || "" },
    { skip: !isAuthenticated || !user?.id },
  );

  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      disconnectSocket();
      return;
    }

    let isMounted = true;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (socketUrl) {
      const socket = getSocket(user.id);
      const handleCount = (payload: { unread_count: number }) => {
        if (!isMounted) return;
        try {
          dispatch(
            notificationsApi.util.upsertQueryData(
              "getUnreadCount",
              { user_id: user.id },
              Number(payload?.unread_count || 0),
            ),
          );
        } catch (error) {
          console.error("Failed to update unread count:", error);
        }
      };

      socket.on("notification:count", handleCount);

      return () => {
        isMounted = false;
        socket.off("notification:count", handleCount);
      };
    }

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (!isMounted) return;
          refetch();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [dispatch, isAuthenticated, refetch, user?.id]);

  return (
    <button
      type="button"
      onClick={() => router.push("/notifications")}
      className="relative p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
      <span className="sr-only">Notifications</span>
    </button>
  );
}
