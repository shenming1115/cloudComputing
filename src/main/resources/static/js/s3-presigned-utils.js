/**
 * S3 Pre-signed URL Utility Functions
 * 
 * This module demonstrates how to use pre-signed URLs for secure S3 access
 * with a FULLY PRIVATE S3 bucket (Block All Public Access enabled)
 */

/**
 * Generate pre-signed URL for uploading a file
 * Returns a temporary URL that can be used to upload directly to S3
 */
async function getPresignedUploadUrl(fileExtension, contentType, folder = 'images') {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Authentication required');
    }
    
    try {
        const response = await fetch('/api/s3/presigned-upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folder: folder,
                fileExtension: fileExtension,
                contentType: contentType
            })
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized - Please login again');
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get upload URL');
        }
        
        const data = await response.json();
        return data.uploadUrl;
    } catch (error) {
        console.error('Error getting pre-signed upload URL:', error);
        throw error;
    }
}

/**
 * Upload file directly to S3 using pre-signed URL
 * No authentication needed - the URL itself contains temporary credentials
 */
async function uploadFileToS3(file, presignedUrl) {
    try {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        // Extract the S3 key from the presigned URL
        const url = new URL(presignedUrl);
        const s3Key = url.pathname.substring(1); // Remove leading '/'
        
        return s3Key;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
}

/**
 * Complete upload workflow: Get presigned URL, upload file, return S3 key
 */
async function uploadImageWithPresignedUrl(file) {
    try {
        // Step 1: Get file extension
        const fileExtension = '.' + file.name.split('.').pop();
        
        // Step 2: Get pre-signed upload URL from backend
        const presignedUrl = await getPresignedUploadUrl(fileExtension, file.type, 'images');
        
        // Step 3: Upload directly to S3
        const s3Key = await uploadFileToS3(file, presignedUrl);
        
        console.log('Upload successful. S3 Key:', s3Key);
        return s3Key;
    } catch (error) {
        console.error('Upload workflow failed:', error);
        throw error;
    }
}

/**
 * Get pre-signed URL for viewing/downloading a file
 * Converts S3 key to a temporary viewable URL
 */
async function getPresignedDownloadUrl(s3Key) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Authentication required');
    }
    
    try {
        const response = await fetch('/api/s3/presigned-download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                s3Key: s3Key
            })
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized - Please login again');
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get download URL');
        }
        
        const data = await response.json();
        return data.downloadUrl;
    } catch (error) {
        console.error('Error getting pre-signed download URL:', error);
        throw error;
    }
}

/**
 * Display image from S3 using pre-signed URL
 * Example usage in post rendering
 */
async function displayS3Image(s3Key, imgElement) {
    try {
        const presignedUrl = await getPresignedDownloadUrl(s3Key);
        imgElement.src = presignedUrl;
    } catch (error) {
        console.error('Failed to load image:', error);
        imgElement.src = '/images/placeholder.jpg'; // Fallback image
    }
}

/**
 * Example: Upload image from file input
 */
async function handleImageUpload(fileInputElement) {
    const file = fileInputElement.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }
    
    try {
        // Show loading indicator
        console.log('Uploading...');
        
        // Upload and get S3 key
        const s3Key = await uploadImageWithPresignedUrl(file);
        
        console.log('Upload complete! S3 Key:', s3Key);
        alert('Upload successful!');
        
        return s3Key; // Return S3 key to store in database
    } catch (error) {
        alert('Upload failed: ' + error.message);
        console.error(error);
    }
}

/**
 * Example: Create post with image
 */
async function createPostWithImage() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = '/html/login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    const content = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postImage');
    
    let imageS3Key = null;
    
    // Upload image if selected
    if (fileInput.files.length > 0) {
        try {
            imageS3Key = await uploadImageWithPresignedUrl(fileInput.files[0]);
        } catch (error) {
            alert('Image upload failed: ' + error.message);
            return;
        }
    }
    
    // Create post with S3 key (NOT public URL)
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                imageUrl: imageS3Key, // Store S3 key, not URL
                userId: user.id
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        
        alert('Post created successfully!');
        window.location.reload();
    } catch (error) {
        alert('Failed to create post: ' + error.message);
    }
}

/**
 * Example: Render posts with S3 images
 * When displaying posts, convert S3 keys to pre-signed URLs
 */
async function renderPostWithImage(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    
    let imageHTML = '';
    
    // If post has an image S3 key, generate pre-signed URL
    if (post.imageUrl) {
        try {
            const presignedUrl = await getPresignedDownloadUrl(post.imageUrl);
            imageHTML = `<img src="${presignedUrl}" alt="Post image" class="post-image">`;
        } catch (error) {
            console.error('Failed to load image:', error);
            imageHTML = '<div class="image-error">Image unavailable</div>';
        }
    }
    
    postElement.innerHTML = `
        <div class="post-header">
            <h3>${post.user.username}</h3>
            <span>${new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div class="post-content">
            <p>${post.content}</p>
            ${imageHTML}
        </div>
    `;
    
    return postElement;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getPresignedUploadUrl,
        uploadFileToS3,
        uploadImageWithPresignedUrl,
        getPresignedDownloadUrl,
        displayS3Image,
        handleImageUpload,
        createPostWithImage,
        renderPostWithImage
    };
}
