import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
) {
  res.status(200).json({
    success: true,
    data,
    meta,
    message,
  });
}

export function sendError(res: Response, error: string, statusCode = 500) {
  res.status(statusCode).json({
    success: false,
    error,
  });
}

export function paginate(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
