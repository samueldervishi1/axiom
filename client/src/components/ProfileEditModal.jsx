import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ProfileEditModal = ({ isOpen, onClose, onSuccess, profile }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    title: '',
    links: [''],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState('');
  const fileInputRef = useRef(null);

  // Set the current profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        title: profile.title || profile.profession || '',
        links: profile.links && profile.links.length > 0 ? profile.links : [''],
      });
      setImageFile(null);
      setImagePreview(null);
      setNotification('');
      setError('');
    }
  }, [isOpen, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...formData.links];
    newLinks[index] = value;
    setFormData((prev) => ({
      ...prev,
      links: newLinks,
    }));
  };

  const addLinkField = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, ''],
    }));
  };

  const removeLinkField = (index) => {
    if (formData.links.length > 1) {
      const newLinks = formData.links.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        links: newLinks,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError('Image file size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setImageFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (userId) => {
    if (!imageFile) return;

    const imageFormData = new FormData();
    imageFormData.append('file', imageFile);

    await axios.post(`${API_URL}profile/${userId}/image`, imageFormData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  const deleteImage = async () => {
    try {
      setIsLoading(true);
      const userId = await getUserIdFromServer();

      await axios.delete(`${API_URL}profile/${userId}/image`, {
        withCredentials: true,
      });

      setNotification(
        'Profile image has been removed. It might take some time to appear all over the page.'
      );
      setTimeout(() => {
        setNotification('');
        onSuccess();
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data?.message || 'Failed to remove profile image'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userId = await getUserIdFromServer();

      // Filter out empty links
      const filteredLinks = formData.links.filter((link) => link.trim() !== '');

      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        title: formData.title,
        links: filteredLinks,
      };

      await axios.put(`${API_URL}profile/${userId}/update`, updateData, {
        withCredentials: true,
      });

      // Upload image if selected
      if (imageFile) {
        await uploadImage(userId);
        setNotification(
          'Profile updated successfully! Your new image might take some time to appear all over the page.'
        );
      } else {
        setNotification('Profile updated successfully!');
      }

      setTimeout(() => {
        setNotification('');
        onSuccess();
        onClose();
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
      console.error(
        'Failed to update profile:',
        error?.message || 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Profile</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {notification && (
            <div className={styles.successMessage}>{notification}</div>
          )}

          <div className={styles.formGroup}>
            <label>Profile Image</label>
            <div className={styles.imageUploadSection}>
              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img
                    src={imagePreview}
                    alt='Preview'
                    className={styles.previewImage}
                  />
                  <button
                    type='button'
                    onClick={handleImageRemove}
                    className={styles.removeImageBtn}
                  >
                    <FaTimes /> Remove
                  </button>
                </div>
              )}

              <div className={styles.imageUploadControls}>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept='image/*'
                  className={styles.fileInput}
                  id='imageUpload'
                />
                <label htmlFor='imageUpload' className={styles.fileInputLabel}>
                  {imageFile ? 'Change Image' : 'Upload Image'}
                </label>

                <button
                  type='button'
                  onClick={deleteImage}
                  disabled={isLoading}
                  className={styles.deleteImageBtn}
                >
                  Remove Current Image
                </button>
              </div>

              <small className={styles.fieldHelp}>
                Upload a new profile image or remove your current one. Maximum
                file size: 5MB.
              </small>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='fullName'>Full Name</label>
            <input
              type='text'
              id='fullName'
              name='fullName'
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder='Enter your full name'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='title'>Professional Title</label>
            <input
              type='text'
              id='title'
              name='title'
              value={formData.title}
              onChange={handleInputChange}
              placeholder='Software Engineer, Product Manager, etc.'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='bio'>Bio</label>
            <textarea
              id='bio'
              name='bio'
              value={formData.bio}
              onChange={handleInputChange}
              rows='4'
              placeholder='A brief description about yourself'
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.linksHeader}>
              <label>Links</label>
              <button
                type='button'
                onClick={addLinkField}
                className={styles.addLinkBtn}
              >
                <FaPlus /> Add Link
              </button>
            </div>

            {formData.links.map((link, index) => (
              <div key={index} className={styles.linkInputGroup}>
                <input
                  type='url'
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder='https://github.com/username'
                  className={styles.linkInput}
                />
                {formData.links.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeLinkField(index)}
                    className={styles.removeLinkBtn}
                  >
                    <FaMinus />
                  </button>
                )}
              </div>
            ))}
            <small className={styles.fieldHelp}>
              Add links to your social profiles, portfolio, or website
            </small>
          </div>

          <div className={styles.modalActions}>
            <button
              type='button'
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
