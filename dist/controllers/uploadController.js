import logger from "../utils/logger.js";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
export const uploadPresignedUrl = async (req, res) => {
    logger.info(`presignedUrl request ${req}`);
    try {
        const { fileName, fileType } = req.query;
        if (!fileName || !fileType) {
            return res.status(400).json({ error: "Missing fileName or fileType" });
        }
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/${fileName}`,
            ContentType: fileType,
        });
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        // console.log("presignedUrl:" + presignedUrl);
        res.json({ url: presignedUrl });
    }
    catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Error generating pre-signed URL" });
    }
};
export const downloadPresignedUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
    // console.log("presignedUrl:" + url);
    return url;
};
