import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorResponse(message: string, statusCode = 400, code = "BAD_REQUEST") {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validasi input gagal";
    return errorResponse(message, 400, "VALIDATION_ERROR");
  }

  console.error("Unhandled API Error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan internal pada server",
        details: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
    },
    { status: 500 }
  );
}
