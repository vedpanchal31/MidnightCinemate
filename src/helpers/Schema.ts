import * as Yup from "yup";
import i18n from "@/utils/i18n";

export const createSchema = (schema: Record<string, Yup.AnySchema>) => {
  return Yup.object().shape(schema);
};

export const YupRequiredString = Yup.string().required(() =>
  i18n.t("COMMON.REQUIRED.FIELD"),
);




export const YupRequiredNumber = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(0, () => i18n.t("COMMON.NO_NEGATIVE_NUMBER"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  )
  .test(
    "is-integer",
    () => i18n.t("COMMON.NO_DECIMAL_ALLOWED"),
    (value) => Number.isInteger(value),
  );

export const YupWithoutDecimalRequiredNumber = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(0, () => i18n.t("COMMON.NO_NEGATIVE_NUMBER"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  );

export const YupWithoutDecimalUptoTwoDecimalRequiredNumber = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(0, () => i18n.t("COMMON.NO_NEGATIVE_NUMBER"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  )
  .test(
    "decimal-precision",
    () => i18n.t("COMMON.MAX_2_DECIMALS_ALLOWED"),
    (value) => {
      if (value === undefined || value === null) return true; // If value is undefined or null, don't validate
      const decimalCount = (value.toString().split(".")[1] || "").length;
      return decimalCount <= 2; // Check if the number has more than 2 decimals
    },
  );


export const YupRequiredNumberWithDecimal = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(0, () => i18n.t("COMMON.NO_NEGATIVE_NUMBER"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  )
  .test(
    "decimal-precision",
    () => i18n.t("COMMON.MAX_2_DECIMALS_ALLOWED"),
    (value) => {
      if (value === undefined || value === null) return true; // If value is undefined or null, don't validate
      const decimalCount = (value.toString().split(".")[1] || "").length;
      return decimalCount <= 4; // Check if the number has more than 4 decimals
    },
  );


export const YupRequiredNumberWithoutZero = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(0, () => i18n.t("COMMON.NO_NEGATIVE_NUMBER"))
  .test(
    "decimal-precision",
    () => i18n.t("COMMON.MAX_2_DECIMALS_ALLOWED"),
    (value) => {
      if (value === undefined || value === null) return true; // If value is undefined or null, don't validate
      const decimalCount = (value.toString().split(".")[1] || "").length;
      return decimalCount <= 2; // Check if the number has more than 2 decimals
    },
  );

export const YupRequiredNumberInRange = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(1, () => i18n.t("COMMON.MINIMUM_VALUE_ERROR"))
  .max(24, () => i18n.t("COMMON.MAXIMUM_VALUE_ERROR"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  )
  .test(
    "is-integer",
    () => i18n.t("COMMON.NO_DECIMAL_ALLOWED"),
    (value) => Number.isInteger(value),
  );

export const YupRequiredPercentageNumberInRange = Yup.number()
  .typeError(() => i18n.t("COMMON.RESPONSETIMEERROR"))
  .required(() => i18n.t("COMMON.REQUIRED.FIELD"))
  .min(1, () => i18n.t("COMMON.MINIMUM_VALUE_ERROR"))
  .max(100, () => i18n.t("COMMON.MAXIMUM_VALUE_REFUND_ERROR"))
  .test(
    "not-zero",
    () => i18n.t("COMMON.ZERO_NOT_ALLOWED"),
    (value) => value !== 0,
  )
  .test(
    "is-integer",
    () => i18n.t("COMMON.NO_DECIMAL_ALLOWED"),
    (value) => Number.isInteger(value),
  );


export const YupRequiredImage = Yup.mixed().required(() =>
  i18n.t("COMMON.REQUIRED.FIELD"),
);


export const YupStringNoLeadingTrailingSpaces = YupRequiredString.matches(
  /^(?!\s)/,
  () => i18n.t("COMMON.NO.START.SPACE"),
).matches(/(?<!\s)$/, () => i18n.t("COMMON.NO.END.SPACE"));

export const YupEmail = YupStringNoLeadingTrailingSpaces.email(() =>
  i18n.t("COMMON.MUST.BE.VALID.EMAIL"),
).matches(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  i18n.t("COMMON.MUST.BE.VALID.EMAIL"),
);

export const YupStringMaxLength = (max: number, min?: number) => {
  let schema = YupStringNoLeadingTrailingSpaces.max(
    max,
    () =>
      `${i18n.t("COMMON.MUST.BE.ATMOST")}${max}${i18n.t("COMMON.CHARACTERS")}`,
  );

  if (min !== undefined) {
    schema = schema.min(
      min,
      () =>
        `${i18n.t("COMMON.MUST.BE.ATLEAST")}${min}${i18n.t("COMMON.CHARACTERS")}`,
    );
  }

  return schema;
};

export const YupPassword = YupStringNoLeadingTrailingSpaces.min(8, () =>
  i18n.t("COMMON.PASS.8.CHARS"),
)
  .max(64, () => i18n.t("COMMON.PASS.64.CHARS"))
  .matches(/[0-9]/, () => i18n.t("COMMON.PASS.REQUIRES.NUMBER"))
  .matches(/[a-z]/, () => i18n.t("COMMON.PASS.REQUIRES.LOWER.CASE"))
  .matches(/[A-Z]/, () => i18n.t("COMMON.PASS.REQUIRES.UPPER.CASE"))
  .matches(/[\W_]/, () => i18n.t("COMMON.PASS.REQUIRES.SYMBOL"));