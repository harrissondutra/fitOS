import multer, { Multer } from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Configurar multer para memória
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
  // Verificar tipo de arquivo
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato não suportado. Use JPG, PNG ou WEBP.'));
  }
};

// Configurações de upload por tipo
const uploadConfigs = {
  avatar: {
    fileSize: 2 * 1024 * 1024, // 2MB
    fieldName: 'avatar',
    maxFiles: 1,
  },
  logo: {
    fileSize: 2 * 1024 * 1024, // 2MB
    fieldName: 'logo',
    maxFiles: 1,
  },
  exercise: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'image',
    maxFiles: 1,
  },
  workout: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'image',
    maxFiles: 1,
  },
  gallery: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldName: 'images',
    maxFiles: 10,
  },
  document: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'document',
    maxFiles: 1,
  },
};

// Função para criar middleware de upload
const createUploadMiddleware = (type: keyof typeof uploadConfigs) => {
  const config = uploadConfigs[type];
  
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.fileSize,
      files: config.maxFiles,
    },
  });
};

// Middlewares específicos para cada tipo
export const uploadAvatar = createUploadMiddleware('avatar').single('avatar');
export const uploadLogo = createUploadMiddleware('logo').single('logo');
export const uploadExerciseImage = createUploadMiddleware('exercise').single('image');
export const uploadExerciseVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de vídeo não suportado'));
    }
  }
}).single('video');
export const uploadWorkoutImage = createUploadMiddleware('workout').single('image');
export const uploadGalleryImages = createUploadMiddleware('gallery').array('images', 10);
export const uploadDocument = createUploadMiddleware('document').single('document');

// Middleware genérico para upload
export const createUpload = (type: keyof typeof uploadConfigs, fieldName?: string) => {
  const config = uploadConfigs[type];
  const finalFieldName = fieldName || config.fieldName;
  
  if (config.maxFiles === 1) {
    return createUploadMiddleware(type).single(finalFieldName);
  } else {
    return createUploadMiddleware(type).array(finalFieldName, config.maxFiles);
  }
};

// Middleware para validar dimensões da imagem
export const validateImageDimensions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as any[] || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return next();
    }

    for (const file of files) {
      // Verificar dimensões usando sharp
      const metadata = await sharp(file.buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return res.status(400).json({
          success: false,
          error: { message: 'Não foi possível ler as dimensões da imagem' }
        });
      }

      // Verificar dimensões mínimas
      if (metadata.width < 100 || metadata.height < 100) {
        return res.status(400).json({
          success: false,
          error: { message: 'Imagem muito pequena. Dimensões mínimas: 100x100px' }
        });
      }

      // Verificar se é quadrada (opcional, mas recomendado para avatar)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio < 0.5 || aspectRatio > 2) {
        logger.warn(`Image aspect ratio warning: ${aspectRatio} for file ${file.originalname}`);
      }
    }

    next();
  } catch (error) {
    logger.error('Error validating image dimensions:', error);
    return res.status(400).json({
      success: false,
      error: { message: 'Erro ao processar a imagem' }
    });
  }
};

// Middleware para validar dimensões específicas por tipo
export const validateImageDimensionsByType = (type: 'avatar' | 'logo' | 'exercise' | 'workout' | 'gallery' | 'document') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as any[] || (req.file ? [req.file] : []);
      
      if (files.length === 0) {
        return next();
      }

      const minDimensions = {
        avatar: { width: 100, height: 100 },
        logo: { width: 50, height: 50 },
        exercise: { width: 200, height: 200 },
        workout: { width: 300, height: 200 },
        gallery: { width: 400, height: 300 },
        document: { width: 100, height: 100 },
      };

      const config = minDimensions[type];

      for (const file of files) {
        const metadata = await sharp(file.buffer).metadata();
        
        if (!metadata.width || !metadata.height) {
          return res.status(400).json({
            success: false,
            error: { message: 'Não foi possível ler as dimensões da imagem' }
          });
        }

        if (metadata.width < config.width || metadata.height < config.height) {
          return res.status(400).json({
            success: false,
            error: { message: `Imagem muito pequena. Dimensões mínimas: ${config.width}x${config.height}px` }
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Error validating image dimensions by type:', error);
      return res.status(400).json({
        success: false,
        error: { message: 'Erro ao processar a imagem' }
      });
    }
  };
};

// Middleware para tratamento de erros do multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { message: 'Arquivo muito grande. Verifique o tamanho máximo permitido.' }
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: { message: 'Muitos arquivos. Verifique o limite máximo de arquivos.' }
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: { message: 'Campo de arquivo inesperado.' }
      });
    }
  }

  if (error.message === 'Formato não suportado. Use JPG, PNG ou WEBP.') {
    return res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }

  return next(error);
};

// Middleware para tratamento de erros específico por tipo
export const handleUploadErrorByType = (type: keyof typeof uploadConfigs) => {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
      const config = uploadConfigs[type];
      const maxSizeMB = Math.round(config.fileSize / (1024 * 1024));
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: { message: `Arquivo muito grande. Máximo ${maxSizeMB}MB para ${type}.` }
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: { message: `Muitos arquivos. Máximo ${config.maxFiles} arquivo(s) para ${type}.` }
        });
      }
    }

    return handleUploadError(error, req, res, next);
  };
};
