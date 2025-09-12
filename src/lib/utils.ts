import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time from HH:MM to HH"h"MM format
 * Examples: 12:35 -> 12h35, 09:17 -> 09h17, 03:15 -> 03h15
 */
export function formatTime24h(time: string): string {
  if (!time || !time.includes(':')) return time;
  
  const [hours, minutes] = time.split(':');
  const formattedHours = hours.padStart(2, '0');
  const formattedMinutes = minutes.padStart(2, '0');
  
  return `${formattedHours}h${formattedMinutes}`;
}

/**
 * Parses time from HH"h"MM format back to HH:MM
 * Examples: 12h35 -> 12:35, 09h17 -> 09:17
 */
export function parseTime24h(formattedTime: string): string {
  if (!formattedTime || !formattedTime.includes('h')) return formattedTime;
  
  return formattedTime.replace('h', ':');
}
