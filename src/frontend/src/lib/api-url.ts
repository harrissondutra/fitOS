/**
 * Helper function to build API URLs
 * This is a pure utility function that doesn't require 'use client'
 * @param path - API path (e.g., '/api/users')
 * @returns Full API URL with base URL prefix
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
