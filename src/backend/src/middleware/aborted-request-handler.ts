import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para tratar requisições abortadas pelo cliente
 * Evita erros de "socket.destroy is not a function" quando o cliente cancela a requisição
 */
export function abortedRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Detectar quando a requisição é abortada
  req.on('aborted', () => {
    logger.debug(`Request aborted by client: ${req.method} ${req.url}`);
    // Não fazer nada - apenas logar para debug
    // O Express já trata isso internamente
  });

  // Tratar erros de socket
  req.on('error', (err: Error) => {
    // Ignorar erros de socket fechado/abortado
    if (
      err.message.includes('ECONNRESET') ||
      err.message.includes('EPIPE') ||
      err.message.includes('socket') ||
      err.name === 'AbortError'
    ) {
      logger.debug(`Request socket error (ignored): ${req.method} ${req.url}`, err.message);
      // Não propagar o erro
      return;
    }
    
    // Para outros erros, propagar
    next(err);
  });

  // Interceptar res.end para evitar erros ao tentar escrever em socket fechado
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    if (req.aborted || req.socket.destroyed) {
      logger.debug(`Tried to send response to aborted request: ${req.method} ${req.url}`);
      // Não tentar enviar resposta se a requisição foi abortada
      return res;
    }
    return originalEnd(chunk, encoding, cb);
  };

  next();
}
