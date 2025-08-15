import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ExperienceModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    location: '',
    employmentType: 'Full-time',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Freelance',
    'Volunteer',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userId = await getUserIdFromServer();

      const submitData = {
        ...formData,
        endDate: formData.isCurrent ? null : formData.endDate,
      };

      await axios.post(`${API_URL}users/${userId}/experience`, submitData, {
        withCredentials: true,
      });

      onSuccess();
      onClose();
      setFormData({
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        location: '',
        employmentType: 'Full-time',
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add experience');
      throw new Error(
        `Failed to add experience: ${error?.message || 'Unknown error'}`
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
          <h2>Add Experience</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor='company'>Company *</label>
            <input
              type='text'
              id='company'
              name='company'
              value={formData.company}
              onChange={handleInputChange}
              required
              placeholder='Microsoft'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='position'>Position *</label>
            <input
              type='text'
              id='position'
              name='position'
              value={formData.position}
              onChange={handleInputChange}
              required
              placeholder='Senior Software Engineer'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='employmentType'>Employment Type</label>
            <select
              id='employmentType'
              name='employmentType'
              value={formData.employmentType}
              onChange={handleInputChange}
            >
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='location'>Location</label>
            <input
              type='text'
              id='location'
              name='location'
              value={formData.location}
              onChange={handleInputChange}
              placeholder='Seattle, WA'
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
              <label htmlFor='endDate'>End Date</label>
              <input
                type='date'
                id='endDate'
                name='endDate'
                value={formData.endDate}
                onChange={handleInputChange}
                disabled={formData.isCurrent}
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type='checkbox'
              id='isCurrent'
              name='isCurrent'
              checked={formData.isCurrent}
              onChange={handleInputChange}
            />
            <label htmlFor='isCurrent'>I currently work here</label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='description'>Description</label>
            <textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              rows='4'
              placeholder='Describe your responsibilities and achievements...'
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
              {isLoading ? 'Adding...' : 'Add Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceModal;
