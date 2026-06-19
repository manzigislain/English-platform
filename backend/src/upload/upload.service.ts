import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
  }

  async uploadAudio(
    buffer: Buffer,
    fileName: string,
    folder = "english-platform/audio",
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "video",
          public_id: fileName.replace(/\.[^/.]+$/, ""),
          format: "mp3",
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    folder = "english-platform/videos",
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "video",
          public_id: fileName.replace(/\.[^/.]+$/, ""),
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadImage(
    buffer: Buffer,
    fileName: string,
    folder = "english-platform/images",
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string, resourceType: "image" | "video" = "image"): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  async deleteAudioFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  }
}
