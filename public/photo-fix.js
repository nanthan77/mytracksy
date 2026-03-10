// Photo Upload Fix for MyTracksy User Profile
// This is a standalone fix for the photo upload functionality

console.log('🔧 Photo Fix Script Loading...');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePhotoFix();
});

function initializePhotoFix() {
    console.log('🚀 Initializing Photo Fix...');
    
    // Load any saved photo immediately
    loadSavedPhoto();
    
    // Set up event listeners
    setupPhotoEventListeners();
    
    // Add debugging tools
    addPhotoDebugTools();
}

function loadSavedPhoto() {
    const savedPhoto = localStorage.getItem('mytracksy_user_photo');
    const savedAvatar = localStorage.getItem('mytracksy_user_avatar');
    
    console.log('📸 Checking saved data:', { 
        hasPhoto: !!savedPhoto, 
        hasAvatar: !!savedAvatar 
    });
    
    if (savedPhoto) {
        console.log('📸 Loading saved photo...');
        displayPhoto(savedPhoto);
    } else if (savedAvatar) {
        console.log('👤 Loading saved avatar...');
        displayAvatar(savedAvatar);
    }
}

function displayPhoto(imageData) {
    console.log('🖼️ Displaying photo...');
    
    const profileImage = document.getElementById('profileImage');
    const defaultAvatar = document.getElementById('defaultAvatar');
    
    console.log('🔍 Elements check:', {
        profileImage: !!profileImage,
        defaultAvatar: !!defaultAvatar
    });
    
    if (profileImage && defaultAvatar) {
        profileImage.src = imageData;
        profileImage.style.display = 'block';
        profileImage.style.width = '100%';
        profileImage.style.height = '100%';
        profileImage.style.borderRadius = '50%';
        profileImage.style.objectFit = 'cover';
        profileImage.style.position = 'absolute';
        profileImage.style.top = '0';
        profileImage.style.left = '0';
        
        defaultAvatar.style.display = 'none';
        
        console.log('✅ Photo displayed successfully');
        return true;
    } else {
        console.error('❌ Profile elements not found');
        return false;
    }
}

function displayAvatar(avatarClass) {
    console.log('👤 Displaying avatar:', avatarClass);
    
    const profileImage = document.getElementById('profileImage');
    const defaultAvatar = document.getElementById('defaultAvatar');
    
    if (profileImage && defaultAvatar) {
        profileImage.style.display = 'none';
        defaultAvatar.style.display = 'flex';
        defaultAvatar.className = avatarClass;
        
        console.log('✅ Avatar displayed successfully');
        return true;
    } else {
        console.error('❌ Profile elements not found');
        return false;
    }
}

function setupPhotoEventListeners() {
    console.log('⚡ Setting up event listeners...');
    
    // Override the upload photo function
    window.uploadPhotoFixed = function(input) {
        console.log('📤 Upload photo function called');
        
        const file = input.files[0];
        if (!file) {
            console.log('❌ No file selected');
            return;
        }
        
        console.log('📁 File details:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file!');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file too large! Please select an image under 5MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            console.log('✅ File read successfully, size:', imageData.length);
            
            // Save to localStorage
            localStorage.setItem('mytracksy_user_photo', imageData);
            localStorage.removeItem('mytracksy_user_avatar'); // Clear avatar if photo is uploaded
            
            // Display the photo
            if (displayPhoto(imageData)) {
                closePhotoSelectorFixed();
                showNotificationFixed('Profile photo updated successfully!', 'success');
            } else {
                showNotificationFixed('Error displaying photo. Please try again.', 'error');
            }
        };
        
        reader.onerror = function() {
            console.error('❌ Error reading file');
            showNotificationFixed('Error reading image file. Please try again.', 'error');
        };
        
        reader.readAsDataURL(file);
    };
    
    // Override the select avatar function
    window.selectAvatarFixed = function(avatarClass) {
        console.log('👤 Select avatar function called:', avatarClass);
        
        // Save to localStorage
        localStorage.setItem('mytracksy_user_avatar', avatarClass);
        localStorage.removeItem('mytracksy_user_photo'); // Clear photo if avatar is selected
        
        // Display the avatar
        if (displayAvatar(avatarClass)) {
            closePhotoSelectorFixed();
            showNotificationFixed('Avatar updated successfully!', 'success');
        } else {
            showNotificationFixed('Error updating avatar. Please try again.', 'error');
        }
    };
    
    // Override photo selector functions
    window.openPhotoSelectorFixed = function() {
        console.log('📂 Opening photo selector...');
        const avatarSelector = document.getElementById('avatarSelector');
        if (avatarSelector) {
            avatarSelector.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            showNotificationFixed('Choose your avatar or upload a photo!', 'info');
        } else {
            console.error('❌ Avatar selector not found');
        }
    };
    
    window.closePhotoSelectorFixed = function() {
        console.log('📂 Closing photo selector...');
        const avatarSelector = document.getElementById('avatarSelector');
        if (avatarSelector) {
            avatarSelector.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
}

function showNotificationFixed(message, type) {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Try to use existing notification function first
    if (typeof showPersonalTaxNotification === 'function') {
        showPersonalTaxNotification(message, type);
        return;
    }
    
    // Fallback to simple alert if no notification system
    alert(message);
}

function addPhotoDebugTools() {
    console.log('🛠️ Adding debug tools...');
    
    // Add debug functions to window
    window.photoDebug = {
        testPhoto: function() {
            console.log('🧪 Testing photo upload...');
            const testImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiM2NjdFRUEiLz48dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIj5URVNUPC90ZXh0Pjwvc3ZnPg==';
            localStorage.setItem('mytracksy_user_photo', testImageData);
            displayPhoto(testImageData);
            showNotificationFixed('Test photo applied!', 'success');
        },
        
        testAvatar: function() {
            console.log('🧪 Testing avatar selection...');
            const testAvatar = 'fas fa-user-astronaut';
            localStorage.setItem('mytracksy_user_avatar', testAvatar);
            displayAvatar(testAvatar);
            showNotificationFixed('Test avatar applied!', 'success');
        },
        
        clearPhoto: function() {
            console.log('🗑️ Clearing saved photo/avatar...');
            localStorage.removeItem('mytracksy_user_photo');
            localStorage.removeItem('mytracksy_user_avatar');
            
            const profileImage = document.getElementById('profileImage');
            const defaultAvatar = document.getElementById('defaultAvatar');
            
            if (profileImage && defaultAvatar) {
                profileImage.style.display = 'none';
                defaultAvatar.style.display = 'flex';
                defaultAvatar.className = 'fas fa-user';
                showNotificationFixed('Photo/avatar cleared!', 'success');
            }
        },
        
        checkElements: function() {
            console.log('🔍 Checking DOM elements...');
            const elements = {
                profileAvatar: !!document.getElementById('profileAvatar'),
                profileImage: !!document.getElementById('profileImage'),
                defaultAvatar: !!document.getElementById('defaultAvatar'),
                avatarSelector: !!document.getElementById('avatarSelector'),
                photoUpload: !!document.getElementById('photoUpload')
            };
            console.table(elements);
            return elements;
        },
        
        checkStorage: function() {
            console.log('💾 Checking localStorage...');
            const storage = {
                photo: localStorage.getItem('mytracksy_user_photo') ? 'EXISTS' : 'NOT_FOUND',
                avatar: localStorage.getItem('mytracksy_user_avatar') || 'NOT_FOUND'
            };
            console.table(storage);
            return storage;
        }
    };
    
    console.log('🛠️ Debug tools added! Use photoDebug.testPhoto(), photoDebug.testAvatar(), etc.');
}

// Auto-retry loading after a delay to handle timing issues
setTimeout(() => {
    console.log('🔄 Auto-retry loading saved photo...');
    loadSavedPhoto();
}, 1000);

setTimeout(() => {
    console.log('🔄 Final retry loading saved photo...');
    loadSavedPhoto();
}, 3000);

console.log('✅ Photo Fix Script Loaded');