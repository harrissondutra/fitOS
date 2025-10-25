import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import { costTrackerService } from './cost-tracker.service';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwmi8p7mo',
  api_key: process.env.CLOUDINARY_API_KEY || '262953911313355',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'EJzZ3APhGl_Brg2qeigm4aramS8',
});

// Tipos de upload suportados
export type UploadType = 'avatar' | 'logo' | 'exercise' | 'workout' | 'gallery' | 'document' | 'social';

// Interface para configurações de transformação
interface TransformationConfig {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string;
  fetch_format?: string;
  radius?: string;
  effect?: string;
  overlay?: string;
  background?: string;
}

// Configurações de transformação por tipo
const transformationConfigs: Record<UploadType, TransformationConfig> = {
  avatar: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
    radius: 'max',
  },
  logo: {
    width: 200,
    height: 200,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  },
  exercise: {
    width: 800,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  workout: {
    width: 1200,
    height: 800,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  gallery: {
    width: 1920,
    height: 1080,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  document: {
    quality: 'auto',
    fetch_format: 'auto',
  },
  social: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
    radius: 'max',
  },
};

export class CloudinaryService {
  /**
   * Upload genérico de imagem para Cloudinary
   */
  static async uploadImage(
    file: Buffer | string,
    uploadType: UploadType,
    entityId: string,
    publicId?: string,
    customTransformations?: TransformationConfig
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    try {
      const folder = `fitos/${uploadType}s/${entityId}`;
      const finalPublicId = publicId || `${uploadType}_${entityId}_${Date.now()}`;
      
      // Usar transformações customizadas ou padrão
      const transformations = customTransformations || transformationConfigs[uploadType];
      
      // Converter Buffer para data URL se necessário
      let uploadData: string;
      if (Buffer.isBuffer(file)) {
        // Detectar tipo MIME baseado nos primeiros bytes (magic numbers)
        let mimeType = 'image/jpeg'; // Padrão
        if (file[0] === 0x89 && file[1] === 0x50 && file[2] === 0x4E && file[3] === 0x47) {
          mimeType = 'image/png';
        } else if (file[0] === 0x47 && file[1] === 0x49 && file[2] === 0x46) {
          mimeType = 'image/gif';
        } else if (file[0] === 0x52 && file[1] === 0x49 && file[2] === 0x46 && file[3] === 0x46) {
          mimeType = 'image/webp';
        }
        
        uploadData = `data:${mimeType};base64,${file.toString('base64')}`;
      } else {
        uploadData = file; // Já é string
      }
      
      const result = await cloudinary.uploader.upload(uploadData, {
        folder,
        public_id: finalPublicId,
        transformation: [transformations],
        resource_type: 'image',
        overwrite: true,
      });

      logger.info(`${uploadType} uploaded successfully for entity ${entityId}: ${result.public_id}`);
      
      // Rastrear custo do upload
      try {
        await costTrackerService.trackCloudinaryUsage({
          type: 'upload',
          quantity: 1,
          metadata: {
            uploadType,
            entityId,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
            folder: result.folder,
          },
        });
      } catch (error) {
        logger.warn('Failed to track Cloudinary usage:', error);
      }
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error(`Error uploading ${uploadType} to Cloudinary:`, error);
      throw new Error(`Falha ao fazer upload do ${uploadType}`);
    }
  }

  /**
   * Upload de avatar para Cloudinary
   */
  static async uploadAvatar(
    file: Buffer | string,
    userId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string }> {
    const result = await this.uploadImage(file, 'avatar', userId, publicId);
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }

  /**
   * Upload de logo da empresa para Cloudinary
   */
  static async uploadLogo(
    file: Buffer | string,
    tenantId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string }> {
    const result = await this.uploadImage(file, 'logo', tenantId, publicId);
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }

  /**
   * Upload de imagem de exercício para Cloudinary
   */
  static async uploadExerciseImage(
    file: Buffer | string,
    exerciseId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    return await this.uploadImage(file, 'exercise', exerciseId, publicId);
  }

  /**
   * Upload de imagem de treino para Cloudinary
   */
  static async uploadWorkoutImage(
    file: Buffer | string,
    workoutId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    return await this.uploadImage(file, 'workout', workoutId, publicId);
  }

  /**
   * Upload de imagem para galeria
   */
  static async uploadGalleryImage(
    file: Buffer | string,
    galleryId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    return await this.uploadImage(file, 'gallery', galleryId, publicId);
  }

  /**
   * Upload de documento/imagem de documento
   */
  static async uploadDocument(
    file: Buffer | string,
    documentId: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    return await this.uploadImage(file, 'document', documentId, publicId);
  }

  /**
   * Upload múltiplo de imagens
   */
  static async uploadMultipleImages(
    files: Array<{ file: Buffer | string; publicId?: string }>,
    uploadType: UploadType,
    entityId: string
  ): Promise<Array<{ url: string; publicId: string; width: number; height: number }>> {
    try {
      const uploadPromises = files.map(({ file, publicId }, index) =>
        this.uploadImage(file, uploadType, entityId, publicId || `${uploadType}_${entityId}_${Date.now()}_${index}`)
      );

      const results = await Promise.all(uploadPromises);
      logger.info(`Multiple ${uploadType}s uploaded successfully for entity ${entityId}: ${results.length} images`);
      
      return results;
    } catch (error) {
      logger.error(`Error uploading multiple ${uploadType}s to Cloudinary:`, error);
      throw new Error(`Falha ao fazer upload múltiplo de ${uploadType}s`);
    }
  }

  /**
   * Deletar imagem do Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted successfully: ${publicId}`);
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
      throw new Error('Falha ao deletar imagem');
    }
  }

  /**
   * Deletar múltiplas imagens
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
      await Promise.all(deletePromises);
      logger.info(`Multiple images deleted successfully: ${publicIds.length} images`);
    } catch (error) {
      logger.error('Error deleting multiple images from Cloudinary:', error);
      throw new Error('Falha ao deletar múltiplas imagens');
    }
  }

  /**
   * Upload de imagem social (Google, Apple, Microsoft) para Cloudinary
   */
  static async uploadSocialAvatar(
    imageUrl: string,
    userId: string,
    provider: 'google' | 'apple' | 'microsoft'
  ): Promise<{ url: string; publicId: string }> {
    try {
      const folder = `fitos/avatars/${userId}`;
      const publicId = `social_${provider}_${userId}_${Date.now()}`;

      const result = await cloudinary.uploader.upload(imageUrl, {
        folder,
        public_id: publicId,
        transformation: [transformationConfigs.social],
        resource_type: 'image',
        overwrite: true,
      });

      logger.info(`Social avatar uploaded successfully for user ${userId} from ${provider}: ${result.public_id}`);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error('Error uploading social avatar to Cloudinary:', error);
      throw new Error(`Falha ao fazer upload da foto do ${provider}`);
    }
  }

  /**
   * Gerar URL de transformação para otimização
   */
  static generateOptimizedUrl(
    publicId: string,
    transformations: TransformationConfig
  ): string {
    return cloudinary.url(publicId, {
      transformation: [transformations],
      secure: true,
    });
  }

  /**
   * Gerar URL de thumbnail
   */
  static generateThumbnailUrl(
    publicId: string,
    size: number = 150
  ): string {
    return cloudinary.url(publicId, {
      transformation: [{
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      }],
      secure: true,
    });
  }

  /**
   * Verificar se uma imagem existe no Cloudinary
   */
  static async imageExists(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter informações de uma imagem
   */
  static async getImageInfo(publicId: string): Promise<{
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    created_at: string;
  } | null> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at,
      };
    } catch (error) {
      logger.error('Error getting image info from Cloudinary:', error);
      return null;
    }
  }
}
