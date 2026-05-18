import { CalculateRequest, ApiResponse } from '@/types/calculator.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Central fetch wrapper — handles JSON + error extraction.
 */
async function apiFetch(endpoint: string, body: object): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: ApiResponse = await res.json();
  return data;
}

/**
 * Unified calculate — sends operator in the body.
 * POST /api/v1/calculator/calculate
 */
export async function calculate(payload: CalculateRequest): Promise<ApiResponse> {
  return apiFetch('/api/v1/calculator/calculate', payload);
}

/**
 * Dedicated add endpoint.
 * POST /api/v1/calculator/add
 */
export async function add(a: number, b: number): Promise<ApiResponse> {
  return apiFetch('/api/v1/calculator/add', { a, b });
}

/**
 * Dedicated subtract endpoint.
 * POST /api/v1/calculator/subtract
 */
export async function subtract(a: number, b: number): Promise<ApiResponse> {
  return apiFetch('/api/v1/calculator/subtract', { a, b });
}

/**
 * Dedicated multiply endpoint.
 * POST /api/v1/calculator/multiply
 */
export async function multiply(a: number, b: number): Promise<ApiResponse> {
  return apiFetch('/api/v1/calculator/multiply', { a, b });
}

/**
 * Dedicated divide endpoint.
 * POST /api/v1/calculator/divide
 */
export async function divide(a: number, b: number): Promise<ApiResponse> {
  return apiFetch('/api/v1/calculator/divide', { a, b });
}
