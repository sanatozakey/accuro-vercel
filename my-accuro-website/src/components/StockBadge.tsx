import React from 'react';

export type StockStatus = 'out_of_stock' | 'low_stock' | 'in_stock' | null;

interface StockBadgeProps {
  status: StockStatus;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  out_of_stock: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    defaultLabel: 'Out of Stock',
  },
  low_stock: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
    defaultLabel: 'Low Stock',
  },
  in_stock: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    defaultLabel: 'In Stock',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-2 py-1',
    text: 'text-sm',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    dot: 'w-2.5 h-2.5',
    gap: 'gap-2',
  },
};

export function StockBadge({
  status,
  label,
  showLabel = true,
  size = 'md',
  className = '',
}: StockBadgeProps) {
  if (!status) return null;

  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeStyles.text} font-medium ${className}`}
    >
      <span className={`${sizeStyles.dot} rounded-full ${config.dot}`}></span>
      {showLabel && <span>{displayLabel}</span>}
    </span>
  );
}

// Stock status dot only (for compact display)
export function StockDot({
  status,
  size = 'md',
  title,
}: {
  status: StockStatus;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}) {
  if (!status) return null;

  const config = statusConfig[status];
  const dotSize = sizeConfig[size].dot;

  return (
    <span
      className={`inline-block ${dotSize} rounded-full ${config.dot}`}
      title={title || config.defaultLabel}
    ></span>
  );
}

export default StockBadge;
