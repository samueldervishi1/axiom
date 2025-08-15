import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const SkillModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    skillName: '',
    proficiencyLevel: 'BEGINNER',
    endorsementCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const proficiencyLevels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userId = await getUserIdFromServer();

      await axios.post(`${API_URL}users/${userId}/skill`, formData, {
        withCredentials: true,
      });

      onSuccess();
      onClose();
      setFormData({
        skillName: '',
        proficiencyLevel: 'BEGINNER',
        endorsementCount: 0,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add skill');
      this.reportError(
        new Error(`Failed to add skill: ${error?.message || 'Unknown error'}`)
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
          <h2>Add Skill</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor='skillName'>Skill Name *</label>
            <input
              type='text'
              id='skillName'
              name='skillName'
              value={formData.skillName}
              onChange={handleInputChange}
              required
              placeholder='Java'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='proficiencyLevel'>Proficiency Level</label>
            <select
              id='proficiencyLevel'
              name='proficiencyLevel'
              value={formData.proficiencyLevel}
              onChange={handleInputChange}
            >
              {proficiencyLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='endorsementCount'>Endorsement Count</label>
            <input
              type='number'
              id='endorsementCount'
              name='endorsementCount'
              value={formData.endorsementCount}
              onChange={handleInputChange}
              min='0'
              placeholder='0'
            />
            <small className={styles.fieldHelp}>
              Number of endorsements you've received for this skill
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
              {isLoading ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkillModal;
