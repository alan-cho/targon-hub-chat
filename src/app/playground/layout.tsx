"use client";

import React from "react";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      {children}
      {/* Spacer Div to Center Chat */}
      <div className="w-64 flex-shrink-0"></div>
    </div>
  );
}
