import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';

/* Wrap a single async route handler */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/* Patch an Express Router so all route handlers auto-forward errors to Express error middleware */
export function patchRouter(router: Router): Router {
  const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
  for (const method of methods) {
    const original = (router as unknown as Record<string, (...args: unknown[]) => unknown>)[method];
    (router as unknown as Record<string, (...args: unknown[]) => unknown>)[method] = function (...args: unknown[]) {
      const wrapped = args.map((arg: unknown) => {
        if (typeof arg === 'function') {
          return function (this: unknown, req: Request, res: Response, next: NextFunction) {
            try {
              const result = (arg as (...params: unknown[]) => unknown).call(this, req, res, next);
              if (result && typeof (result as { catch?: unknown }).catch === 'function') {
                (result as { catch: (...args: unknown[]) => unknown }).catch(next as (...params: unknown[]) => unknown);
              }
            } catch (err) {
              next(err);
            }
          };
        }
        return arg;
      });
      return original.apply(this, wrapped);
    };
  }
  return router;
}
