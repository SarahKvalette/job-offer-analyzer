export type AnalysisErrorCode =
  | "missing_api_key"
  | "empty_input"
  | "input_too_long"
  | "model_no_tool_call"
  | "model_invalid_output"
  | "upstream_error";

export class AnalysisError extends Error {
  readonly code: AnalysisErrorCode;
  readonly userMessage: string;
  readonly status: number;

  constructor(
    code: AnalysisErrorCode,
    userMessage: string,
    options?: { cause?: unknown; status?: number }
  ) {
    super(userMessage, { cause: options?.cause });
    this.code = code;
    this.userMessage = userMessage;
    this.status = options?.status ?? 400;
  }
}

export function toApiError(err: unknown): {
  status: number;
  body: { error: { code: AnalysisErrorCode; message: string } };
} {
  if (err instanceof AnalysisError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.userMessage } },
    };
  }
  return {
    status: 500,
    body: {
      error: {
        code: "upstream_error",
        message:
          "Something went wrong while contacting the model. Please try again in a moment.",
      },
    },
  };
}
