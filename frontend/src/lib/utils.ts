import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PageResponse } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class ApiContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiContractError';
  }
}

export function normalizePageResponse<T>(data: any): PageResponse<T> {
  // If it's correctly shaped as a Spring Page
  if (data && typeof data === 'object' && Array.isArray(data.content) && data.pageable !== undefined) {
    return {
      items: data.content,
      page: data.number,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages
    };
  }
  
  // If the backend returned a flat array (for endpoints that don't paginate)
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: 1
    };
  }

  // If the shape is unknown or HTML, THROW an explicit error
  throw new ApiContractError(`Unexpected response shape. Expected paginated object or array.`);
}
