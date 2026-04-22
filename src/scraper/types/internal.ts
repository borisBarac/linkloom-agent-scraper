// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ErrorCode = {
  ERR_HTTP_INVALID_URL: "ERR_HTTP_INVALID_URL",
  ERR_HTTP_TIMEOUT: "ERR_HTTP_TIMEOUT",
  ERR_HTTP_STATUS_ERROR: "ERR_HTTP_STATUS_ERROR",
  ERR_HTTP_REQUEST_FAILED: "ERR_HTTP_REQUEST_FAILED",
  ERR_MARKDOWN_CONTENT_EXTRACTION_FAILED: "ERR_MARKDOWN_CONTENT_EXTRACTION_FAILED",
  ERR_MARKDOWN_CONVERSION_FAILED: "ERR_MARKDOWN_CONVERSION_FAILED",
  PDF_MARKDOWN_CONVERSION_FAILED: "PDF_MARKDOWN_CONVERSION_FAILED",
  ERR_COULD_NOT_RENDER: "ERR_COULD_NOT_RENDER",
  LLM_SUMMARU_ERROR: "LLM_SUMMARY_ERROR",
  LLM_FINANCIAL_CHART_ANALYSIS_ERROR: "LLM_FINANCIAL_CHART_ANALYSIS_ERROR",
  LLM_IMAGE_ANALYSIS_ERROR: "LLM_IMAGE_ANALYSIS_ERROR",
  LLM_IMAGE_NOT_SAFE: "LLM_IMAGE_NOT_SAFE",
  LLM_MISSING_API_KEY: "LLM_MISSING_API_KEY",
  LLM_EMBEDDING_ERROR: "LLM_EMBEDDING_ERROR",
  LLM_GUARDRAIL_ERROR: "LLM_GUARDRAIL_ERROR",
  LLM_CONTENT_FLAGGED_BY_GUARDRAIL: "LLM_CONTENT_FLAGGED_BY_GUARDRAIL",
  LLM_JUDGE_PARSE_ERROR: "LLM_JUDGE_PARSE_ERROR",
  LLM_JUDGE_ERROR: "LLM_JUDGE_ERROR",
  COINGECKO_API_ERROR: "COINGECKO_API_ERROR",
  CANDLESTICK_DATA_INVALID: "CANDLESTICK_DATA_INVALID",
  COULD_NOT_RENDER_CHART: "COULD_NOT_RENDER_CHART",
  INVALID_TASK_STATE: "INVALID_TASK_STATE",
  PROXY_LOAD_FAILED: "PROXY_LOAD_FAILED",
  INVALID_PROXY: "INVALID_PROXY",
  INVALID_PROXY_FORMAT: "INVALID_PROXY_FORMAT",
  EMPTY_PROXY_LIST: "EMPTY_PROXY_LIST",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_PROXY_KEYS: "INVALID_PROXY_KEYS",
  NO_OHLC_DATA: "NO_OHLC_DATA",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ScrapperError extends Error {
  code: ErrorCodeType;

  constructor(code: ErrorCodeType, message: string) {
    super(message);
    this.code = code;
    this.name = "ScrapperError";
  }
}
export type ScrapperErrorType = ScrapperError;

export const isScrapperError = (error: unknown, codes: ErrorCodeType[]): error is ScrapperError => {
  return error instanceof ScrapperError && codes.includes(error.code);
};

export type RedisReadDefType = { key: string; items: [string, string[]][] };

export type ModelProvider = "openai" | "gemini" | "openaiMulti" | "geminiMulti" | "openaiMini" | "geminiMini";

export const ChartType = {
  Line: "line",
  Bar: "bar",
  Pie: "pie",
  Candlestick: "candlestick",
  Other: "other",
} as const;
export type ChartTypeType = (typeof ChartType)[keyof typeof ChartType];

export type ProcessingContext = {
  sessionId: string;
  task: string;
  helpers: string[];
};
