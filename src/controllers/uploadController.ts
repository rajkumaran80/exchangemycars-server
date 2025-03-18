import {Request, Response} from "express";
import logger from "../utils/logger.js";
import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3Client from "../utils/s3Client.js";

export const uploadPresignedUrl = async (req: Request, res: Response) => {
    logger.info(`presignedUrl request ${req}`);

    try {
        const { fileName, fileType } = req.query;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: "Missing fileName or fileType" });
        }

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: `uploads/${fileName}`,
            ContentType: fileType as string,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        const cloudFrontUrl = presignedUrl.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com`, `https://${process.env.CLOUDFRONT_DOMAIN}`);

        // console.log("cloudFrontUrl:" + cloudFrontUrl);
        res.json({ url: cloudFrontUrl });
    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Error generating pre-signed URL" });
    }
};

export const downloadPresignedUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
    });

    console.log('command ' + JSON.stringify(command));

    // console.log(JSON.stringify(s3Client));

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

    // console.log("presignedUrl:" + url);

    const cloudFrontUrl = presignedUrl.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com`, `https://${process.env.CLOUDFRONT_DOMAIN}`);


    return cloudFrontUrl;
};