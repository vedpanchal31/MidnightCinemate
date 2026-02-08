import { ErrorMessage, Field } from "formik";
import React, { useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export interface FormikInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  type: string;
  className?: string;
  containerClass?: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  variant?: string;
  disabled?: boolean;
  tooltip?: boolean;
  infoText?: string;
  children?: React.ReactElement;
  isRequired?: boolean;
  labelClass?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const FormikInput = React.forwardRef<HTMLInputElement, FormikInputProps>(
  (
    {
      className,
      containerClass,
      name,
      type,
      label,
      placeholder,
      maxLength,
      variant,
      disabled,
      tooltip = false,
      infoText = "",
      children,
      isRequired = false,
      labelClass,
      icon,
      showPasswordToggle = false,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { t } = useTranslation();
    
    const toggleIsPasswordVisible = useCallback(
      () => setIsPasswordVisible(!isPasswordVisible),
      [isPasswordVisible],
    );

    const getAutoCompleteValue = () => {
      if (type === "password") return "new-password";
      if (type === "email") return "new-email";
      return "off";
    };

    const inputType = showPasswordToggle && type === "password" 
      ? (isPasswordVisible ? "text" : "password")
      : type;

    return (
      <div
        className={cn(
          "space-y-2 w-full",
          containerClass,
        )}
      >
        <label
          className={cn(
            "text-zinc-300 font-medium text-sm",
            labelClass,
          )}
          htmlFor={name}
        >
          {t(label)}
          {isRequired && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          
          <Field
            name={name}
            id={name}
            type={inputType}
            className={cn(
              "h-10 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 w-full rounded-lg px-3 py-2 text-sm outline-none transition-all",
              icon && "pl-10",
              showPasswordToggle && "pr-10",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            maxLength={maxLength}
            ref={ref}
            {...props}
            autoComplete={getAutoCompleteValue()}
            placeholder={placeholder || t(label)}
            disabled={disabled}
          />
          
          {showPasswordToggle && type === "password" && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-primary transition-colors"
              type="button"
              onClick={toggleIsPasswordVisible}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              disabled={disabled}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        
        {children}
        <ErrorMessage
          name={name}
          component="div"
          className="text-xs text-red-400"
        />
      </div>
    );
  },
);

FormikInput.displayName = "FormikInput";

export { FormikInput };
