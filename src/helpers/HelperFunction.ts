import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import toast from "react-hot-toast";

export const handleError = (
  error: FetchBaseQueryError | SerializedError
): void => {
  const message = extractErrorMessage(error);
  toast.error(message);
};

function extractErrorMessage(
  error: FetchBaseQueryError | SerializedError
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