// Express-specific type definitions
import { Request, Response } from "express";
import { UserRole } from "./api.types";

// Extended Express Request with typed body, query, and params
export interface TypedRequest<
  TBody = Record<string, unknown>,
  TQuery = Record<string, unknown>,
  TParams = Record<string, string>,
> extends Omit<Request, "body" | "query" | "params"> {
  body: TBody;
  query: TQuery;
  params: TParams;
  user?: AuthUser;
}

// Authenticated user information from Clerk or session
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  clerkId?: string;
  isActive?: boolean;
  permissions?: string[];
}

// Route handler types
export type AsyncRouteHandler<
  TBody = Record<string, unknown>,
  TQuery = Record<string, unknown>,
  TParams = Record<string, unknown>,
> = (
  req: TypedRequest<TBody, TQuery, TParams>,
  res: Response,
) => Promise<void | Response>;

export type SyncRouteHandler<
  TBody = Record<string, unknown>,
  TQuery = Record<string, unknown>,
  TParams = Record<string, unknown>,
> = (
  req: TypedRequest<TBody, TQuery, TParams>,
  res: Response,
) => void | Response;

// Error handler type
export interface ApiErrorHandler {
  (error: Error, req: Request, res: Response, next: () => void): void;
}

// Middleware type
export type Middleware = (
  req: Request,
  res: Response,
  next: () => void,
) => void | Promise<void>;
