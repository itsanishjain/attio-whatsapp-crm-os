import { env } from '@server/env';
import { createMediaService } from '@whatsapp-crm/core/services/media-service';

export {
  type MediaInfo,
  MediaTransferError,
  buildMediaObjectKey,
  extractMediaInfo,
  isRetryableMediaTransferError,
} from '@whatsapp-crm/core/services/media-service';

export const {
  hasR2Config,
  uploadMediaToR2,
  getMediaDownloadUrl,
  getMediaUploadUrl,
  downloadAndUploadWhatsappMedia,
} = createMediaService(() => env);
