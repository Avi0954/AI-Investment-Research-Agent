import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to smartly merge tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
