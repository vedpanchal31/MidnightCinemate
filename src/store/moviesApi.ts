import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api/baseQuery";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  vote_average: number;
  genres: string[];
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
  endpoints: (builder) => ({
    getNowPlaying: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/now-playing",
        method: "get",
        params: { page },
      }),
    }),
    getUpcoming: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/upcoming",
        method: "get",
        params: { page },
      }),
    }),
    getHindi: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/hindi",
        method: "get",
        params: { page },
      }),
    }),
    getHollywood: builder.query<MovieResponse, number | void>({
      query: (page = 1) => ({
        url: "/api/movies/hollywood",
        method: "get",
        params: { page },
      }),
    }),
    searchMovies: builder.query<MovieResponse, { query: string; page?: number }>({
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
} = moviesApi;
