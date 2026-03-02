import {
  BaseQueryApi,
  BaseQueryFn,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import ApiClient from "./ApiClient";
import { RootState } from "@/store/store";
import { logout } from "@/store/authSlice";

interface BaseQueryParams<D = unknown, P = unknown> {
  url: string;
  method: AxiosRequestConfig["method"];
  data?: D;
  params?: P;
  headers?: Record<string, string>;
  responseType?: AxiosRequestConfig["responseType"];
}

export const baseQuery: BaseQueryFn<BaseQueryParams, unknown, unknown> = async (
  {
    url,
    method,
    data,
    params,
    headers: customHeaders,
    responseType,
  }: BaseQueryParams,
  api: BaseQueryApi,
) => {
  const token = (api.getState() as RootState)?.auth?.token;
  try {
    const result: AxiosResponse = await ApiClient({
      url,
      method,
      data,
      params,
      responseType: responseType || "json",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
      },
    });

    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;

    if (err?.response?.status === 401) {
      api.dispatch(logout());
    }

    return {
      error: {
        status: err.response?.status ?? 500,
        data: err.response?.data || err.message,
      } satisfies FetchBaseQueryError,
    };
  }
};
