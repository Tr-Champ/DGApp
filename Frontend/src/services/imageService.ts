import { Alert } from 'react-native';

const CLOUD_NAME = "b2h01eeh";
const UPLOAD_PRESET = "DGAppImages";

/**
 * Uploads an image file URI to Cloudinary and returns the secure public URL.
 * @param localUri The local file URI from the device (e.g., from expo-image-picker)
 * @returns Promise<string | null> The secure Cloudinary URL or null if failed
 */
export async function uploadImageToCloudinary(localUri: string): Promise<string | null> {
    try {
        const data = new FormData();

        // Extract filename and file type
        const filename = localUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // Append image data for React Native FormData
        data.append('file', {
            uri: localUri,
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
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const result = await response.json();

        if (result.secure_url) {
            return result.secure_url;
        } else {
            console.error('Cloudinary Upload Error:', result);
            Alert.alert('Upload Failed', result.error?.message || 'Could not upload image to Cloudinary.');
            return null;
        }
    } catch (error) {
        console.error('Network or Upload Error:', error);
        Alert.alert('Error', 'Network error while uploading image.');
        return null;
    }
}