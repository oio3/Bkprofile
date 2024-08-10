document.addEventListener('DOMContentLoaded', function() {
    let cropper;
    let selectedFile; // المتغير لتخزين الصورة الأصلية
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const cropImage = document.getElementById('cropImage');
    const cropButton = document.getElementById('cropButton');
    const cropModal = document.getElementById('cropModal');
    const closeModal = document.querySelector('.close');
    const uploadResult = document.getElementById('uploadResult'); // تأكد من أن العنصر موجود
    const uploadProgress = document.getElementById('uploadProgress'); // عنصر عرض نسبة التحميل

    // عند اختيار صورة، تحقق من أبعادها
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file; // تخزين الصورة الأصلية
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    if (img.width === img.height) {
                        // إذا كانت الصورة بنسبة 1:1، قم برفعها مباشرة
                        uploadImage(file);
                    } else {
                        // إذا لم تكن الصورة بنسبة 1:1، اعرض نافذة القص
                        cropImage.src = e.target.result;
                        cropModal.style.display = 'flex';
                        document.querySelector('.crop-section').style.display = 'flex'; // إظهار قسم القص

                        // Destroy the previous cropper instance if exists
                        if (cropper) {
                            cropper.destroy();
                        }

                        // Initialize cropper in the modal
                        cropper = new Cropper(cropImage, {
                            aspectRatio: 1, // Ensure 1:1 aspect ratio
                            viewMode: 1, // Restrict the crop box within the container
                            autoCropArea: 1,
                            crop(event) {
                                // يمكن الحصول على تفاصيل القص هنا إذا لزم الأمر
                            }
                        });
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // عند النقر على زر القص
    cropButton.addEventListener('click', function() {
        if (!selectedFile) return; // التأكد من وجود صورة أصلية

        const croppedImageDataURL = cropper.getCroppedCanvas({
            width: 500,
            height: 500,
        }).toDataURL(); // Get the cropped image as a data URL

        const croppedBlob = dataURLToBlob(croppedImageDataURL);
        const croppedFile = new File([croppedBlob], 'cropped_' + selectedFile.name, { type: 'image/jpeg' });

        // رفع الصورة المقصوصة
        uploadImage(croppedFile);

        imagePreview.src = croppedImageDataURL; // Display the cropped image
        imagePreview.style.display = 'block'; 
        cropModal.style.display = 'none'; // إخفاء النافذة المنبثقة بعد القص
        document.querySelector('.crop-section').style.display = 'none'; // إخفاء قسم القص
        cropper.destroy(); // Remove the cropper instance after cropping
    });

    // عند النقر على زر الإغلاق في النافذة المنبثقة
    closeModal.addEventListener('click', function() {
        cropModal.style.display = 'none';
        document.querySelector('.crop-section').style.display = 'none'; // إخفاء قسم القص
        if (cropper) {
            cropper.destroy();
        }
    });

    // تحويل data URL إلى Blob
    function dataURLToBlob(dataURL) {
        const [header, data] = dataURL.split(',');
        const mime = header.split(':')[1].split(';')[0];
        const binary = atob(data);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mime });
    }

    function uploadImage(file) {
        const formData = new FormData();
        const fileType = getFileType(file.name);

        formData.append('file', file);
        formData.append('upload_preset', 'yjcrfgtf'); // استبدل بـ upload preset الخاص بك
        formData.append('folder', 'Profiles'); // تحميل إلى مجلد "Profiles"
        formData.append('resource_type', fileType);
        formData.append('public_id', 'OIO3F_BK_' + generateFileId()); // استخدام معرف فريد للصورة

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/duxnkfwsm/${fileType}/upload`; // استبدل بـ cloud name الخاص بك

        const xhr = new XMLHttpRequest();
        xhr.open('POST', cloudinaryUrl, true);

        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                if (uploadProgress) {
                    uploadProgress.innerText = `${Math.round(percentComplete)}%`;
                    // تعديل الشفافية بناءً على نسبة التحميل
                    const opacity = 1 - (percentComplete / 100); // الشفافية تتناقص مع زيادة النسبة
                    uploadProgress.style.background = `rgba(0, 0, 0, ${opacity})`;
                }
            }
        };

        xhr.onload = function() {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                const imageUrl = data.secure_url;
                imagePreview.src = imageUrl ; // Display the cropped image
                 imagePreview.style.display = 'block'; 
                 
                console.log(`Image uploaded successfully! URL: ${imageUrl}`);
                if (uploadResult) {
                  
                    uploadResult.innerHTML = `Image uploaded successfully! <br> <a href="${imageUrl}" target="_blank">View Image</a>`;
                }
            } else {
                if (uploadResult) {
                    uploadResult.innerText = 'Error uploading image.';
                }
            }
        };

        xhr.onerror = function() {
            if (uploadResult) {
                uploadResult.innerText = 'Error uploading image.';
            }
        };

        xhr.send(formData);
    }

    function getFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
            return 'image';
        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
            return 'video';
        } else {
            return 'raw';
        }
    }

    function generateFileId() {
        return Math.random().toString(36).substring(2, 10);
    }
});
