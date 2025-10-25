import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CloudinaryService, UploadType } from '../services/cloudinary.service';
import { 
  uploadExerciseImage, 
  uploadWorkoutImage, 
  uploadGalleryImages, 
  uploadDocument,
  validateImageDimensionsByType,
  handleUploadErrorByType
} from '../middleware/upload.middleware';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { UserRole } from '../../../shared/types/auth.types';

// Interface para requisições com tenant e auth
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

const router = Router();

// POST /api/upload/exercise/:exerciseId - Upload de imagem de exercício
router.post('/exercise/:exerciseId', 
  uploadExerciseImage, 
  validateImageDimensionsByType('exercise'), 
  handleUploadErrorByType('exercise'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nenhum arquivo enviado' }
        });
      }

      const { exerciseId } = req.params;
      const result = await CloudinaryService.uploadExerciseImage(req.file.buffer, exerciseId);
      
      return res.json({
        success: true,
        data: result,
        message: 'Imagem do exercício enviada com sucesso'
      });
    } catch (error) {
      logger.error('Error uploading exercise image:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao fazer upload da imagem do exercício' }
      });
    }
  })
);

// POST /api/upload/workout/:workoutId - Upload de imagem de treino
router.post('/workout/:workoutId', 
  uploadWorkoutImage, 
  validateImageDimensionsByType('workout'), 
  handleUploadErrorByType('workout'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nenhum arquivo enviado' }
        });
      }

      const { workoutId } = req.params;
      const result = await CloudinaryService.uploadWorkoutImage(req.file.buffer, workoutId);
      
      return res.json({
        success: true,
        data: result,
        message: 'Imagem do treino enviada com sucesso'
      });
    } catch (error) {
      logger.error('Error uploading workout image:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao fazer upload da imagem do treino' }
      });
    }
  })
);

// POST /api/upload/gallery/:galleryId - Upload de múltiplas imagens para galeria
router.post('/gallery/:galleryId', 
  uploadGalleryImages, 
  validateImageDimensionsByType('gallery'), 
  handleUploadErrorByType('gallery'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const files = req.files as any[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nenhum arquivo enviado' }
        });
      }

      const { galleryId } = req.params;
      const filesData = files.map(file => ({ file: file.buffer }));
      const results = await CloudinaryService.uploadMultipleImages(filesData, 'gallery', galleryId);
      
      return res.json({
        success: true,
        data: results,
        message: `${results.length} imagem(ns) da galeria enviada(s) com sucesso`
      });
    } catch (error) {
      logger.error('Error uploading gallery images:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao fazer upload das imagens da galeria' }
      });
    }
  })
);

// POST /api/upload/document/:documentId - Upload de documento/imagem
router.post('/document/:documentId', 
  uploadDocument, 
  validateImageDimensionsByType('document'), 
  handleUploadErrorByType('document'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nenhum arquivo enviado' }
        });
      }

      const { documentId } = req.params;
      const result = await CloudinaryService.uploadDocument(req.file.buffer, documentId);
      
      return res.json({
        success: true,
        data: result,
        message: 'Documento enviado com sucesso'
      });
    } catch (error) {
      logger.error('Error uploading document:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao fazer upload do documento' }
      });
    }
  })
);

// POST /api/upload/:type/multiple/:entityId - Upload múltiplo genérico
router.post('/:type/multiple/:entityId', 
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const { type, entityId } = req.params;
      const files = req.files as any[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nenhum arquivo enviado' }
        });
      }

      // Validar tipo de upload
      const validTypes: UploadType[] = ['avatar', 'logo', 'exercise', 'workout', 'gallery', 'document'];
      if (!validTypes.includes(type as UploadType)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Tipo de upload inválido' }
        });
      }

      const filesData = files.map(file => ({ file: file.buffer }));
      const results = await CloudinaryService.uploadMultipleImages(filesData, type as UploadType, entityId);
      
      return res.json({
        success: true,
        data: results,
        message: `${results.length} arquivo(s) enviado(s) com sucesso`
      });
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao fazer upload dos arquivos' }
      });
    }
  })
);

// DELETE /api/upload/:publicId - Deletar imagem
router.delete('/:publicId', 
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const { publicId } = req.params;
      
      await CloudinaryService.deleteImage(publicId);
      
      return res.json({
        success: true,
        message: 'Imagem deletada com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting image:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao deletar imagem' }
      });
    }
  })
);

// POST /api/upload/delete-multiple - Deletar múltiplas imagens
router.post('/delete-multiple', 
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const { publicIds } = req.body;
      
      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Lista de IDs de imagens é obrigatória' }
        });
      }

      await CloudinaryService.deleteMultipleImages(publicIds);
      
      return res.json({
        success: true,
        message: `${publicIds.length} imagem(ns) deletada(s) com sucesso`
      });
    } catch (error) {
      logger.error('Error deleting multiple images:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao deletar imagens' }
      });
    }
  })
);

// GET /api/upload/info/:publicId - Obter informações da imagem
router.get('/info/:publicId', 
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const { publicId } = req.params;
      
      const info = await CloudinaryService.getImageInfo(publicId);
      
      if (!info) {
        return res.status(404).json({
          success: false,
          error: { message: 'Imagem não encontrada' }
        });
      }
      
      return res.json({
        success: true,
        data: info
      });
    } catch (error) {
      logger.error('Error getting image info:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao obter informações da imagem' }
      });
    }
  })
);

// GET /api/upload/thumbnail/:publicId - Gerar URL de thumbnail
router.get('/thumbnail/:publicId', 
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    try {
      const { publicId } = req.params;
      const { size = '150' } = req.query;
      
      const thumbnailUrl = CloudinaryService.generateThumbnailUrl(publicId, parseInt(size as string));
      
      return res.json({
        success: true,
        data: { thumbnailUrl }
      });
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erro ao gerar thumbnail' }
      });
    }
  })
);

export default router;
