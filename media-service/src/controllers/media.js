const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const { logger } = require("../utils/logger");
const Media = require("../models/media");

const uploadMedia = async (req, res) => {
  logger.info("Uploading media...");
  try {
    if (!req.file) {
      logger.error("No file uploaded");
      return res.status(400).json({ status: false, error: "No file uploaded" });
    }
    const { originalName, mimeType, size } = req.file;
    const userId = req.user.userId;
    logger.info(`File details: ${originalName}, ${mimeType}, ${size} bytes`);
    logger.info("cloudinary upload started...");
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `cloudinary upload completed successfully: ${cloudinaryUploadResult.public_id}`
    );

    const newMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      url: cloudinaryUploadResult.secure_url,
      userId,
      originalName,
      mimeType,
      size,
    });
    await newMedia.save();
    logger.info("Media saved to database successfully");
    return res.status(201).json({
      status: true,
      mediaId: newMedia._id,
      url: newMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error uploading media:", error);
    return res
      .status(500)
      .json({ status: false, error: "Error uploading media" });
  }
};

module.exports = {
  uploadMedia,
};
