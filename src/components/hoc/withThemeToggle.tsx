"use client";

import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type WithThemeToggleProps = {
  children?: React.ReactNode;
};

export function withThemeToggle<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  function ComponentWithThemeToggle(props: P & WithThemeToggleProps) {
    return (
      <>
        <div className="fixed right-4 top-4 z-[100]">
          <ThemeToggle />
        </div>
        <WrappedComponent {...props} />
      </>
    );
  }

  ComponentWithThemeToggle.displayName = `withThemeToggle(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ComponentWithThemeToggle;
}
