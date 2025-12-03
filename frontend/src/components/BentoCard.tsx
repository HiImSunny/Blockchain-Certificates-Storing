import React from "react";

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  cta?: React.ReactNode;
}

export default function BentoCard({ title, subtitle, children, cta }: Props) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
        <div>{cta}</div>
      </div>
      <div className="mt-3 text-sm text-gray-700">{children}</div>
    </div>
  );
}
