const prisma = require('../infrastructure/database/prismaClient');
const supabase = require('../infrastructure/storage/supabaseClient');
const logger = require('../infrastructure/logging/logger');

const cleanupAbandonedAttachments = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const abandonedRfqs = await prisma.rFQ.findMany({
      where: {
        status: { in: ['DRAFT', 'CANCELLED'] },
        updatedAt: { lt: thirtyDaysAgo }
      },
      include: { attachments: true }
    });

    for (const rfq of abandonedRfqs) {
      if (rfq.attachments && rfq.attachments.length > 0) {
        const filePaths = rfq.attachments.map((att) => att.fileUrl);
        await supabase.storage.from('rfq-attachments').remove(filePaths);

        await prisma.rFQAttachment.deleteMany({
          where: { rfqId: rfq.id }
        });

        logger.info(
          `Cleaned up ${filePaths.length} attachments for abandoned RFQ ${rfq.id}`
        );
      }
    }
  } catch (error) {
    logger.error('Error in cleanupAbandonedAttachments job:', error);
  }
};

const startJobs = () => {
  // Run once immediately, then every 24 hours (24 * 60 * 60 * 1000)
  cleanupAbandonedAttachments();
  setInterval(cleanupAbandonedAttachments, 86400000);
};

module.exports = { startJobs, cleanupAbandonedAttachments };
