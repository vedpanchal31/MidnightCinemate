"use client";

import React from "react";
import { withThemeToggle } from "@/components/hoc/withThemeToggle";

type AppContentProps = {
  children: React.ReactNode;
};

function AppContentBase({ children }: AppContentProps) {
  return <>{children}</>;
}

const AppContent = withThemeToggle(AppContentBase);

export default AppContent;
