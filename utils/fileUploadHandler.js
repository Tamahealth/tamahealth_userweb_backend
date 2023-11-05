const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to upload a file to S3
const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // The name of S3 bucket
    Key: `uploads/${uuidv4()}-${file.originalname}`, // The name of the file in the S3 bucket
    Body: file.buffer, // The file buffer
    ContentType: file.mimetype, // The type of the file
    ACL: "public-read", // Access control for the file
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // The URL of the file in S3
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Middleware to handle file upload and S3 interaction
const fileUploadMiddleware = async (req, res, next) => {
  if (req.file) {
    try {
      const fileUrl = await uploadFileToS3(req.file);
      req.fileUrl = fileUrl; // Attach the file URL to the request object
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("No file provided"));
  }
};

module.exports = {
  upload,
  fileUploadMiddleware,
};
