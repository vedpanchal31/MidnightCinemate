import { BaseQueryApi, BaseQueryFn, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import ApiClient from "./ApiClient";

interface BaseQueryParams<D = unknown, P = unknown> {
  url: string;
  method: AxiosRequestConfig["method"];
  data?: D;
  params?: P;
  headers?: Record<string, string>;
  responseType?: AxiosRequestConfig["responseType"];
}

export const baseQuery: BaseQueryFn<BaseQueryParams, unknown, unknown> = async (
  { url, method, data, params, headers: customHeaders, responseType }: BaseQueryParams,
  _api: BaseQueryApi
) => {
  void _api;
  try {
    const result: AxiosResponse = await ApiClient({
      url,
      method,
      data,
      params,
      responseType: responseType || "json",
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    });

    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;

    return {
      error: {
        status: err.response?.status ?? 500,
        data: err.response?.data || err.message,
      } satisfies FetchBaseQueryError,
    };
  }
};
