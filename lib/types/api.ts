// ─── Shared API Response Types ──────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Standard API success/error envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | ApiError;
  message?: string;
}

/** Paginated list response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Commonly used sort direction */
export type SortDirection = "asc" | "desc";

/** Query filter params shared across list endpoints */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: SortDirection;
  search?: string;
}
