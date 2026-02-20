/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api/baseQuery";
import {
  TimeSlot,
  CreateTimeSlotRequest,
  UpdateTimeSlotRequest,
  TimeSlotQuery,
  TimeSlotResponse,
  Booking,
  CreateBookingRequest,
} from "@/lib/database/schema";
import { KEEP_UNUSED_DATA_FOR } from "@/data/constants";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  vote_average: number;
  genres: string[];
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_url: string | null;
  order: number;
};

export type CrewMember = {
  id: number;
  name: string;
  profile_url?: string | null;
};

export type MovieVideo = {
  id: string;
  name: string;
  type: string;
  key: string;
  site: string;
  official: boolean;
  url: string | null;
};

export type MovieExtended = Movie & {
  backdrop_url: string | null;
  runtime: number;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  cast: CastMember[];
  director: CrewMember | null;
  writer: CrewMember | null;
  producer: CrewMember | null;
  trailer_url: string | null;
  videos: MovieVideo[];
};

export type MovieResponse = {
  page?: number;
  results: Movie[];
  total_pages?: number;
  total_results?: number;
};

export const moviesApi = createApi({
  reducerPath: "moviesApi",
  baseQuery,
  tagTypes: ["Booking", "TimeSlot"],
  endpoints: (builder) => ({
    getNowPlaying: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/now-playing",
        method: "get",
        params: { page },
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
    }),
    getUpcoming: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/upcoming",
        method: "get",
        params: { page },
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
    }),
    getHindi: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/hindi",
        method: "get",
        params: { page },
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
    }),
    getHollywood: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/hollywood",
        method: "get",
        params: { page },
      }),
    }),
    searchMovies: builder.query<
      MovieResponse,
      { query: string; page?: number }
    >({
      query: ({ query, page = 1 }) => ({
        url: "/api/movies/search",
        method: "get",
        params: { q: query, page },
      }),
    }),
    getMovieById: builder.query<Movie, number>({
      query: (id) => ({
        url: `/api/movies/${id}`,
        method: "get",
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
    }),
    getMovieDetailsExtended: builder.query<MovieExtended, number>({
      query: (id) => ({
        url: `/api/movies/${id}/extended`,
        method: "get",
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
    }),
    // Time Slot endpoints
    getTimeSlotsByMovie: builder.query<
      TimeSlot[],
      { tmdb_movie_id: number; date_from?: string; date_to?: string }
    >({
      query: ({ tmdb_movie_id, date_from, date_to }) => ({
        url: "/api/time-slots/movie",
        method: "get",
        params: { tmdb_movie_id, date_from, date_to },
        keepUnusedDataFor: KEEP_UNUSED_DATA_FOR,
      }),
      transformResponse: (response: TimeSlotResponse) => response.data || [],
      providesTags: ["TimeSlot"],
    }),
    getAllTimeSlots: builder.query<TimeSlot[], TimeSlotQuery | void>({
      query: (params) => ({
        url: "/api/time-slots",
        method: "get",
        params,
      }),
      transformResponse: (response: TimeSlotResponse) => response.data || [],
    }),
    createTimeSlot: builder.mutation<TimeSlot, CreateTimeSlotRequest>({
      query: (timeSlotData) => ({
        url: "/api/time-slots",
        method: "post",
        data: timeSlotData,
      }),
    }),
    updateTimeSlot: builder.mutation<
      TimeSlot,
      { id: string; updates: UpdateTimeSlotRequest }
    >({
      query: ({ id, updates }) => ({
        url: `/api/time-slots/${id}`,
        method: "put",
        data: updates,
      }),
    }),
    deleteTimeSlot: builder.mutation<boolean, string>({
      query: (id) => ({
        url: `/api/time-slots/${id}`,
        method: "delete",
      }),
    }),
    getBookingsByMovieAndTime: builder.query<
      Booking[],
      { tmdb_movie_id: number; show_date: string; show_time: string }
    >({
      query: (params) => ({
        url: "/api/bookings/movie",
        method: "get",
        params,
      }),
      transformResponse: (response: { success: boolean; data: Booking[] }) =>
        response.data || [],
      providesTags: ["Booking"],
    }),
    createBooking: builder.mutation<Booking[], CreateBookingRequest>({
      query: (bookingData) => ({
        url: "/api/bookings",
        method: "post",
        data: bookingData,
      }),
      transformResponse: (response: { success: boolean; data: Booking[] }) =>
        response.data || [],
      invalidatesTags: ["Booking", "TimeSlot"],
    }),
    getUserBookings: builder.query<Booking[], string>({
      query: (userId) => ({
        url: `/api/bookings/user/${userId}`,
        method: "get",
      }),
      transformResponse: (response: { success: boolean; data: Booking[] }) =>
        response.data || [],
      providesTags: ["Booking"],
    }),
    cancelBookings: builder.mutation<
      { success: boolean; message: string; cancelled_count: number },
      { user_id: string; booking_ids: number[] }
    >({
      query: (payload) => ({
        url: "/api/bookings/cancel",
        method: "post",
        data: payload,
      }),
      invalidatesTags: ["Booking", "TimeSlot"],
    }),
    createCheckoutSession: builder.mutation<
      { success: boolean; url: string; sessionId: string },
      CreateBookingRequest & {
        booking_ids?: number[];
        movie_title?: string | React.ReactNode;
        user_email?: string | null;
      }
    >({
      query: (bookingData) => ({
        url: "/api/checkout",
        method: "post",
        data: bookingData,
      }),
    }),
    getBookingBySessionId: builder.query<any, string>({
      query: (sessionId) => ({
        url: `/api/bookings/session/${sessionId}`,
        method: "get",
      }),
    }),
  }),
});

export const {
  useGetNowPlayingQuery,
  useGetUpcomingQuery,
  useGetHindiQuery,
  useGetHollywoodQuery,
  useSearchMoviesQuery,
  useGetMovieByIdQuery,
  useGetMovieDetailsExtendedQuery,
  useGetTimeSlotsByMovieQuery,
  useGetAllTimeSlotsQuery,
  useCreateTimeSlotMutation,
  useUpdateTimeSlotMutation,
  useDeleteTimeSlotMutation,
  useGetBookingsByMovieAndTimeQuery,
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useCancelBookingsMutation,
  useCreateCheckoutSessionMutation,
  useGetBookingBySessionIdQuery,
} = moviesApi;
