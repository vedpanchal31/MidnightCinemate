import React, { useEffect } from "react";
import { RxCross1 } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ModalProps {
  show: boolean;
  close: () => void;
  outsideClose?: boolean;
  escapeClose?: boolean;
  title?: string | React.ReactNode;
  className?: string;
  children: React.ReactNode;
  size?: "lg" | "custom" | "md";
  titleAlignment?: "justify-center" | "justify-start";
  titleClassName?: string;
}

const SizesClassNames = {
  lg: "md:w-[1050px] w-[90%] ",
  custom: "",
  md: "max-w-4xl",
};

const Modal: React.FC<ModalProps> = ({
  size = "custom",
  show,
  close,
  outsideClose = true,
  escapeClose = true,
  title,
  className,
  children,
  titleAlignment,
  titleClassName,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      // Get the main content area and apply blur
      const mainElement = document.querySelector("main");
      const headerElement = document.querySelector("header");

      if (mainElement) {
        (mainElement as HTMLElement).style.filter = "blur(5px)";
        (mainElement as HTMLElement).style.transition =
          "filter 0.3s ease-in-out";
      }
      if (headerElement) {
        (headerElement as HTMLElement).style.filter = "blur(5px)";
        (headerElement as HTMLElement).style.transition =
          "filter 0.3s ease-in-out";
      }
    } else {
      document.body.style.overflow = "auto";
      const mainElement = document.querySelector("main");
      const headerElement = document.querySelector("header");

      if (mainElement) {
        (mainElement as HTMLElement).style.filter = "blur(0px)";
      }
      if (headerElement) {
        (headerElement as HTMLElement).style.filter = "blur(0px)";
      }
    }

    return () => {
      const mainElement = document.querySelector("main");
      const headerElement = document.querySelector("header");
      if (mainElement) {
        (mainElement as HTMLElement).style.filter = "blur(0px)";
      }
      if (headerElement) {
        (headerElement as HTMLElement).style.filter = "blur(0px)";
      }
    };
  }, [show]);

  useEffect(() => {
    if (!escapeClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && show) {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [show, close, escapeClose]);

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (outsideClose && event.target === event.currentTarget) {
      close();
      document.body.style.overflow = "auto";
    }
  };

  return (
    <>
      {show && (
        <div
          className={cn(
            "fixed h-full modal top-0 bottom-0 flex left-0 right-0 mx-auto w-full bg-black bg-opacity-60 z-[99999999] overflow-y-auto",
          )}
          onClick={handleOutsideClick}
        >
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "bg-white shadow-lg rounded-[20px] h-max w-[90%] mx-auto my-[3%] xs:w-[95%]",
                SizesClassNames[size] || "md:w-[1005px]",
                className,
              )}
            >
              {title && (
                <div
                  className={cn(
                    "w-full flex z-10 border-b border-secondary-100 px-5 md:px-10 py-5 relative",
                    titleAlignment ?? "justify-between",
                  )}
                >
                  <h2
                    className={cn(
                      "flex font-semibold text-2xl justify-start items-center capitalize",
                      titleClassName,
                    )}
                  >
                    {typeof title === "string" ? t(title) : title}
                  </h2>
                  <RxCross1
                    data-testid="modal-close-button"
                    className="cursor-pointer text-primary-400 absolute ltr:right-4 top-4 rtl:left-4"
                    onClick={close}
                  />
                </div>
              )}
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default Modal;
