const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
  const uploadParams = {
    Bucket: bucketName,
    Key: `uploads/${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const data = await s3.send(command);
    return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${uploadParams.Key}`;
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
