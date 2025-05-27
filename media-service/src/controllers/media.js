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

const getAllMedia = async (req, res) => {
  logger.info("Fetching all media...");
  try {
    const userId = req.user.userId;
    const mediaList = await Media.find({ userId }).sort({ createdAt: -1 });
    logger.info(`Found ${mediaList.length} media items for user ${userId}`);
    return res.status(200).json({
      status: true,
      media: mediaList,
      message: "Media fetched successfully",
    });
  } catch (error) {
    logger.error("Error fetching media:", error);
    return res
      .status(500)
      .json({ status: false, error: "Error fetching media" });
  }
};

module.exports = {
  uploadMedia,
  getAllMedia,
};
