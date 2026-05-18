export type Operator = '+' | '-' | '*' | '/';

export interface CalculateRequest {
  a: number;
  b: number;
  operator: Operator;
}

export interface CalculationResult {
  result: number;
  expression: string;
  operation: string;
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  data?: CalculationResult;
  message?: string;
  errors?: { field: string; message: string }[];
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: number;
  operation: string;
  timestamp: string;
}
