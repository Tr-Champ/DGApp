import { Alert } from 'react-native';

const CLOUD_NAME = "b2h01eeh";
const UPLOAD_PRESET = "DGAppImages";

export interface ImageUploadInput {
    uri: string;
    base64?: string | null;
    mimeType?: string | null;
}

/**
 * Uploads an image to Cloudinary and returns the secure public HTTPS URL.
 * Supports:
 * 1. Base64 JSON payload (preferred in React Native / Expo to avoid multipart boundary bugs on Android)
 * 2. Standard FormData without manual Content-Type header (browser/fetch auto-assigns boundary)
 *
 * @param input Local URI string or an object with { uri, base64, mimeType }
 * @returns Promise<string | null> The secure Cloudinary URL or null if failed
 */
export async function uploadImageToCloudinary(
    input: string | ImageUploadInput
): Promise<string | null> {
    try {
        const uri = typeof input === 'string' ? input : input.uri;
        const base64 = typeof input === 'object' ? input.base64 : null;
        const mimeType = typeof input === 'object' ? input.mimeType : null;

        // Method 1: Upload via Base64 JSON (rock-solid on Android, iOS, Web)
        if (base64) {
            const filename = uri.split('/').pop() || 'upload.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const detectedType = mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        file: `data:${detectedType};base64,${base64}`,
                        upload_preset: UPLOAD_PRESET,
                    }),
                }
            );

            const result = await response.json();
            if (result.secure_url) {
                return result.secure_url;
            } else {
                console.error('[Cloudinary Base64 Error]:', result);
                Alert.alert('Upload Failed', result.error?.message || 'Cloudinary upload failed.');
                return null;
            }
        }

        // Method 2: Standard React Native FormData (DO NOT set Content-Type header manually)
        const data = new FormData();
        const filename = uri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

        data.append('file', {
            uri,
            name: filename,
            type,
        } as any);

        data.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json',
                    // Note: Do NOT set 'Content-Type': 'multipart/form-data'!
                    // React Native and fetch automatically inject the boundary.
                },
            }
        );

        const result = await response.json();

        if (result.secure_url) {
            return result.secure_url;
        } else {
            console.error('[Cloudinary FormData Error]:', result);
            Alert.alert('Upload Failed', result.error?.message || 'Could not upload image to Cloudinary.');
            return null;
        }
    } catch (error: any) {
        console.error('[Cloudinary Network Error]:', error);
        Alert.alert('Upload Error', 'Network error while uploading image to Cloudinary. Please check your connection.');
        return null;
    }
}