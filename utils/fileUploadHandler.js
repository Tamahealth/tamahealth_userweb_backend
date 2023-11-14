const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const bucketRegion = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Create S3 client
const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to upload a file to S3
const uploadFileToS3 = async (file) => {
  const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
  const uploadParams = {
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileKey}`;
    return { fileUrl, fileKey };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Middleware to handle file upload and S3 interaction
const fileUploadMiddleware = async (req, res, next) => {
  if (req.file) {
    try {
      const { fileUrl, fileKey } = await uploadFileToS3(req.file);
      req.fileUrl = fileUrl; // Attach the file URL to the request object
      req.fileKey = fileKey; // Attach the file key to the request object
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("No file provided"));
  }
};

// Function to delete a file from S3
const deleteFileFromS3 = async (fileKey) => {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileKey,
  };

  try {
    await s3.send(new DeleteObjectCommand(deleteParams));
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  upload,
  fileUploadMiddleware,
  deleteFileFromS3,
};
