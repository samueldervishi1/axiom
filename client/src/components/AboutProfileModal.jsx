import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { BsFillInfoSquareFill } from 'react-icons/bs';
import styles from '../styles/modal.module.css';
import profileAvatar from '../assets/user.webp';

const AboutProfileModal = ({ isOpen, onClose, profile }) => {
  const formatAccountCreationDate = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.aboutProfileHeaderContent}>
            <BsFillInfoSquareFill className={styles.aboutProfileIcon} />
            <h2>About this profile</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.aboutProfileContent}>
          <div className={styles.aboutProfileAvatarSection}>
            <img
              src={profileAvatar}
              alt='Profile Avatar'
              className={styles.aboutProfileAvatar}
            />
          </div>

          <div className={styles.aboutProfileUsernameSection}>
            <h3 className={styles.aboutProfileUsername}>
              @{profile?.username || 'Unknown'}
            </h3>
          </div>

          <div className={styles.aboutProfileDescription}>
            <p>
              To help keep our community authentic, we're showing information
              about accounts on {window.location.hostname}. People can see this
              by tapping on the ••• on your profile and choosing About This
              Profile. See why this information is important.
            </p>
          </div>
          <div className={styles.aboutProfileInfo}>
            <div className={styles.aboutProfileSection}>
              <div className={styles.aboutProfileSectionHeader}>
                <FaCalendarAlt className={styles.aboutProfileSectionIcon} />
                <h3 className={styles.aboutProfileSectionTitle}>Date joined</h3>
              </div>
              <p className={styles.aboutProfileSectionContent}>
                {formatAccountCreationDate(profile?.accountCreationDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutProfileModal;
