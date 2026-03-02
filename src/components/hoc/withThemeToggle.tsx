"use client";

import React from "react";
import TopRightActions from "@/components/TopRightActions";

type WithThemeToggleProps = {
  children?: React.ReactNode;
};

export function withThemeToggle<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  function ComponentWithThemeToggle(props: P & WithThemeToggleProps) {
    return (
      <>
        <TopRightActions />
        <WrappedComponent {...props} />
      </>
    );
  }

  ComponentWithThemeToggle.displayName = `withThemeToggle(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ComponentWithThemeToggle;
}
