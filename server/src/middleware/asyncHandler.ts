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
    const original = (router as any)[method];
    (router as any)[method] = function (...args: any[]) {
      const wrapped = args.map((arg: any) => {
        if (typeof arg === 'function') {
          return function (this: any, req: Request, res: Response, next: NextFunction) {
            try {
              const result = arg.call(this, req, res, next);
              if (result && typeof (result as any).catch === 'function') {
                (result as any).catch(next);
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
