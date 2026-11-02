import { HttpInterceptorFn } from '@angular/common/http';

/** Envoie le cookie de session avec chaque appel à l'API. */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));
