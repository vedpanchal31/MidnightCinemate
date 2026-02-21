import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import moment from "moment";
import toast from "react-hot-toast";

export const handleError = (
  error: FetchBaseQueryError | SerializedError,
): void => {
  const message = extractErrorMessage(error);
  toast.error(message);
};

function extractErrorMessage(
  error: FetchBaseQueryError | SerializedError,
): string {
  // RTK Query error
  if ("status" in error) {
    if (
      typeof error.data === "object" &&
      error.data !== null &&
      "message" in error.data &&
      typeof error.data.message === "string"
    ) {
      return error.data.message;
    }

    // Optional: handle string backend responses
    if (typeof error.data === "string") {
      return error.data;
    }
  }

  // SerializedError
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "An unknown error occurred.";
}

export const formatDate = (
  date: string | number | Date,
  format: string = "hh:mm a",
) => {
  return moment.utc(date).local().format(format);
};

export const convertDateTimeToUTC = (date: string, time: string) => {
  const utcDateTime = moment(`${date} ${time}`).local().utc().format();
  return utcDateTime;
};
