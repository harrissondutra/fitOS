import { Request, Response, NextFunction } from 'express';

/**
 * AsyncHandler - Wrapper para funções async em rotas Express
 * 
 * Captura erros de funções async e os passa para o middleware de erro
 * evitando a necessidade de try/catch em cada rota.
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
