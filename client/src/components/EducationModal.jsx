import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const EducationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    grade: '',
    description: '',
    activities: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      await axios.post(`${API_URL}users/${userId}/education`, formData, {
        withCredentials: true,
      });

      onSuccess();
      onClose();
      setFormData({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        grade: '',
        description: '',
        activities: '',
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add education');
      throw new Error(
        `Failed to add education: ${error?.message || 'Unknown error'}`
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
          <h2>Add Education</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor='institution'>Institution *</label>
            <input
              type='text'
              id='institution'
              name='institution'
              value={formData.institution}
              onChange={handleInputChange}
              required
              placeholder='Stanford University'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='degree'>Degree *</label>
            <input
              type='text'
              id='degree'
              name='degree'
              value={formData.degree}
              onChange={handleInputChange}
              required
              placeholder='Master of Science'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='fieldOfStudy'>Field of Study *</label>
            <input
              type='text'
              id='fieldOfStudy'
              name='fieldOfStudy'
              value={formData.fieldOfStudy}
              onChange={handleInputChange}
              required
              placeholder='Computer Science'
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor='startDate'>Start Date *</label>
              <input
                type='date'
                id='startDate'
                name='startDate'
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='endDate'>End Date *</label>
              <input
                type='date'
                id='endDate'
                name='endDate'
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='grade'>Grade/GPA</label>
            <input
              type='text'
              id='grade'
              name='grade'
              value={formData.grade}
              onChange={handleInputChange}
              placeholder='3.9 GPA'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='description'>Description</label>
            <textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              rows='3'
              placeholder='Specialized in machine learning and distributed systems...'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='activities'>Activities and Societies</label>
            <textarea
              id='activities'
              name='activities'
              value={formData.activities}
              onChange={handleInputChange}
              rows='2'
              placeholder='Computer Science Society President, Teaching Assistant...'
            />
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
              {isLoading ? 'Adding...' : 'Add Education'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EducationModal;
