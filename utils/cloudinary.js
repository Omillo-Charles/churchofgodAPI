import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/env.js';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key:    CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// Uploads an image file path (temp disk storage) to Cloudinary
export const uploadToCloudinary = async (filePath, folder = 'ntcogk') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error.message);
        throw new Error('Failed to upload image to Cloudinary.');
    }
};

// Uploads a file buffer (memory storage) using a stream to Cloudinary
export const uploadBufferToCloudinary = (fileBuffer, folder = 'ntcogk') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary stream upload error:', error.message);
                    return reject(new Error('Failed to upload stream to Cloudinary.'));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// Deletes an image from Cloudinary using its public ID
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Cloudinary deletion error:', error.message);
        throw new Error('Failed to delete image from Cloudinary.');
    }
};
