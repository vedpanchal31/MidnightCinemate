"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, MailOpen, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import {
  useDeleteAllMutation,
  useDeleteOneMutation,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "@/store/notificationsApi";
import { showToast } from "@/lib/toast";

type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

const getErrorMessage = (error: unknown) => {
  const err = error as { data?: { message?: string }; message?: string };
  return err?.data?.message || err?.message || "Something went wrong.";
};

export default function NotificationsPage() {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const [movieTitles, setMovieTitles] = React.useState<Record<number, string>>(
    {},
  );
  const { data: items = [], isFetching: isLoading } = useGetNotificationsQuery(
    { user_id: user?.id || "", limit: 50, offset: 0 },
    { skip: !isAuthenticated || !user?.id },
  );
  const unreadCount = items.filter((item) => !item.is_read).length;

  const [markReadMutation] = useMarkReadMutation();
  const [markAllReadMutation] = useMarkAllReadMutation();
  const [deleteOneMutation] = useDeleteOneMutation();
  const [deleteAllMutation] = useDeleteAllMutation();

  React.useEffect(() => {
    const ids = Array.from(
      new Set(
        items
          .map((item) => Number(item.data?.tmdb_movie_id))
          .filter((id) => !Number.isNaN(id) && id > 0),
      ),
    );
    if (ids.length === 0) return;

    let isMounted = true;
    Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/movies/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { id, title: data?.title as string };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!isMounted) return;
      const next: Record<number, string> = {};
      results.forEach((entry) => {
        if (entry?.id && entry?.title) {
          next[entry.id] = entry.title;
        }
      });
      if (Object.keys(next).length > 0) {
        setMovieTitles((prev) => ({ ...prev, ...next }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [items]);

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      const data = await markAllReadMutation({ user_id: user.id }).unwrap();
      if (data?.message) showToast.success(data.message);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const deleteAll = async () => {
    if (!user?.id) return;
    try {
      const data = await deleteAllMutation({ user_id: user.id }).unwrap();
      if (data?.message) showToast.success(data.message);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const markRead = async (id: number) => {
    if (!user?.id) return;
    try {
      const data = await markReadMutation({
        user_id: user.id,
        notification_id: id,
      }).unwrap();
      if (data?.message) showToast.success(data.message);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const deleteOne = async (id: number) => {
    if (!user?.id) return;
    try {
      const data = await deleteOneMutation({
        user_id: user.id,
        notification_id: id,
      }).unwrap();
      if (data?.message) showToast.success(data.message);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Notifications</h1>
          <p className="text-muted-foreground">
            Please log in to view your notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Updates about your account and bookings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={markAllRead}>
              Mark all read {unreadCount > 0 ? `(${unreadCount})` : ""}
            </Button>
            <Button variant="ghost" onClick={deleteAll}>
              Clear all
            </Button>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  item.is_read
                    ? "border-white/10 bg-white/5"
                    : "border-primary/40 bg-primary/10 shadow-[0_0_20px_-8px_rgba(229,9,20,0.6)]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-lg font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const movieTitle =
                          item.data?.tmdb_movie_id &&
                          movieTitles[Number(item.data.tmdb_movie_id)]
                            ? movieTitles[Number(item.data.tmdb_movie_id)]
                            : null;
                        const rawAmount =
                          item.data?.amount !== undefined
                            ? Number(item.data.amount)
                            : null;
                        const amountText =
                          rawAmount !== null && !Number.isNaN(rawAmount)
                            ? ` Amount: INR ${rawAmount.toFixed(2)}.`
                            : "";

                        if (item.type === "payment_success") {
                          const base = movieTitle
                            ? `Payment successful for ${movieTitle}.`
                            : "Payment successful.";
                          return `${base}${amountText}`;
                        }
                        if (item.type === "booking_refunded") {
                          const base = movieTitle
                            ? `Refund successful for ${movieTitle}.`
                            : "Refund successful.";
                          return `${base}${amountText}`;
                        }
                        if (item.type === "booking_confirmed" && movieTitle) {
                          return `Booking confirmed for ${movieTitle}. Enjoy the show.`;
                        }
                        return item.message;
                      })()}
                    </div>
                    {!item.is_read ? (
                      <div className="inline-flex items-center gap-2 text-xs text-primary/90 bg-primary/15 px-2.5 py-1 rounded-full">
                        Unread
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.is_read ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => markRead(item.id)}
                        aria-label="Mark read"
                        title="Mark read"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteOne(item.id)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
