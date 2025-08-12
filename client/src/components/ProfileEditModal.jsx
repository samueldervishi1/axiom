import { useState, useEffect } from 'react';
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

  // Set the current profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        title: profile.title || profile.profession || '',
        links: profile.links && profile.links.length > 0 ? profile.links : [''],
      });
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

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
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
