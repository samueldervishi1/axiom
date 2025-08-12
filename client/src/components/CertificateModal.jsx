import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const CertificateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    doesNotExpire: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        expirationDate: formData.doesNotExpire ? null : formData.expirationDate,
      };

      await axios.post(`${API_URL}users/${userId}/certificate`, submitData, {
        withCredentials: true,
      });

      onSuccess();
      onClose();
      setFormData({
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expirationDate: '',
        credentialId: '',
        credentialUrl: '',
        description: '',
        doesNotExpire: false,
      });
    } catch (error) {
      console.error('Error adding certificate:', error);
      setError(error.response?.data?.message || 'Failed to add certificate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add License & Certification</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor='name'>Name *</label>
            <input
              type='text'
              id='name'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder='AWS Certified Solutions Architect'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='issuingOrganization'>Issuing Organization *</label>
            <input
              type='text'
              id='issuingOrganization'
              name='issuingOrganization'
              value={formData.issuingOrganization}
              onChange={handleInputChange}
              required
              placeholder='Amazon Web Services'
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor='issueDate'>Issue Date *</label>
              <input
                type='date'
                id='issueDate'
                name='issueDate'
                value={formData.issueDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='expirationDate'>Expiration Date</label>
              <input
                type='date'
                id='expirationDate'
                name='expirationDate'
                value={formData.expirationDate}
                onChange={handleInputChange}
                disabled={formData.doesNotExpire}
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type='checkbox'
              id='doesNotExpire'
              name='doesNotExpire'
              checked={formData.doesNotExpire}
              onChange={handleInputChange}
            />
            <label htmlFor='doesNotExpire'>
              This credential does not expire
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='credentialId'>Credential ID</label>
            <input
              type='text'
              id='credentialId'
              name='credentialId'
              value={formData.credentialId}
              onChange={handleInputChange}
              placeholder='AWS-CSA-123456'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='credentialUrl'>Credential URL</label>
            <input
              type='url'
              id='credentialUrl'
              name='credentialUrl'
              value={formData.credentialUrl}
              onChange={handleInputChange}
              placeholder='https://aws.amazon.com/certification/verify/123456'
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
              placeholder='Validates expertise in designing distributed systems on AWS...'
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
              {isLoading ? 'Adding...' : 'Add Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateModal;
