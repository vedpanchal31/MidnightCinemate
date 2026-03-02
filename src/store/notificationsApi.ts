import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api/baseQuery";

export type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

type NotificationsResponse = {
  success: boolean;
  data: NotificationRow[];
};

type UnreadCountResponse = {
  success: boolean;
  unread_count: number;
};

type ActionResponse = {
  success: boolean;
  message?: string;
  updated?: number | boolean;
  deleted?: number | boolean;
};

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery,
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationRow[],
      { user_id: string; limit?: number; offset?: number }
    >({
      query: ({ user_id, limit = 50, offset = 0 }) => ({
        url: "/api/notifications",
        method: "get",
        params: { user_id, limit, offset },
      }),
      transformResponse: (response: NotificationsResponse) =>
        response.data || [],
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadCount: builder.query<number, { user_id: string }>({
      query: ({ user_id }) => ({
        url: "/api/notifications/unread-count",
        method: "get",
        params: { user_id },
      }),
      transformResponse: (response: UnreadCountResponse) =>
        Number(response.unread_count || 0),
      providesTags: [{ type: "Notification", id: "COUNT" }],
    }),
    markRead: builder.mutation<
      ActionResponse,
      { user_id: string; notification_id: number }
    >({
      query: ({ user_id, notification_id }) => ({
        url: "/api/notifications",
        method: "patch",
        data: { user_id, notification_id },
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
    markAllRead: builder.mutation<ActionResponse, { user_id: string }>({
      query: ({ user_id }) => ({
        url: "/api/notifications",
        method: "patch",
        data: { user_id, mark_all: true },
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
    deleteOne: builder.mutation<
      ActionResponse,
      { user_id: string; notification_id: number }
    >({
      query: ({ user_id, notification_id }) => ({
        url: "/api/notifications",
        method: "patch",
        data: { user_id, notification_id, delete_one: true },
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
    deleteAll: builder.mutation<ActionResponse, { user_id: string }>({
      query: ({ user_id }) => ({
        url: "/api/notifications",
        method: "patch",
        data: { user_id, delete_all: true },
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteOneMutation,
  useDeleteAllMutation,
} = notificationsApi;
