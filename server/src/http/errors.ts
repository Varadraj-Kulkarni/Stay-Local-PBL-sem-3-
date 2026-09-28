export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown> | undefined;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown> | undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Malformed JSON request or invalid parameters.', details?: Record<string, unknown> | undefined) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required or invalid token.', details?: Record<string, unknown> | undefined) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.', details?: Record<string, unknown> | undefined) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'The requested resource was not found.', details?: Record<string, unknown> | undefined) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(code: string = 'CONFLICT', message: string = 'Resource conflict.', details?: Record<string, unknown> | undefined) {
    super(409, code, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed.', details?: Record<string, unknown> | undefined) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}
