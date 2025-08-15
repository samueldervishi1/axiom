import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const AboutModal = ({ isOpen, onClose, onSuccess, currentAbout = '' }) => {
  const [formData, setFormData] = useState({
    about: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Set the current about text when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        about: currentAbout || '',
      });
    }
  }, [isOpen, currentAbout]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userId = await getUserIdFromServer();

      await axios.put(`${API_URL}profile/${userId}/update`, formData, {
        withCredentials: true,
      });

      onSuccess();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message || 'Failed to update about section'
      );
      throw new Error(
        `Failed to update about section: ${error?.message || 'Unknown error'}`
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
          <h2>Edit About</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor='about'>About</label>
            <textarea
              id='about'
              name='about'
              value={formData.about}
              onChange={handleInputChange}
              rows='8'
              placeholder='Tell us about yourself, your professional background, interests, and what makes you unique...'
            />
            <small className={styles.fieldHelp}>
              Share your professional story, skills, and what you're passionate
              about
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
              {isLoading ? 'Updating...' : 'Update About'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AboutModal;
