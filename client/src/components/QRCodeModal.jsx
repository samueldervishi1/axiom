import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaQrcode, FaDownload, FaShare, FaTimes } from 'react-icons/fa';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';
import styles from '../styles/modal.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const QRCodeModal = ({ isOpen, onClose, profile, profileImageUrl }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const userId = await getUserIdFromServer();
      const response = await axios.get(`${API_URL}qr-code/${userId}`, {
        withCredentials: true,
      });
      setQrCodeUrl(response.data);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'profile-qr-code.png';
      link.click();
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        await navigator.share({
          title: 'My Profile QR Code',
          text: 'Scan this QR code to view my profile!',
          url: qrCodeUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const copyToClipboard = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.qrModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FaQrcode className={styles.modalIcon} />
            Share Your Profile
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.qrModalBody}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Generating your QR code...</p>
            </div>
          ) : qrCodeUrl ? (
            <div className={styles.qrContainer}>
              <div className={styles.threadsCard}>
                <div className={styles.cardNotchTop}></div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <div className={styles.axiomLogo}>⚡</div>
                  </div>

                  <div className={styles.cardFields}>
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>DATE</span>
                      <span className={styles.fieldValue}>
                        {new Date()
                          .toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>TIME</span>
                      <span className={styles.fieldValue}>
                        {new Date()
                          .toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>USERNAME</span>
                      <span className={styles.fieldValue}>
                        {profile?.username?.toUpperCase() || 'USER'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.qrSection}>
                    <img
                      src={qrCodeUrl}
                      alt='Profile QR Code'
                      className={styles.qrImage}
                    />
                  </div>

                  <div className={styles.profileSection}>
                    <div className={styles.profileLeft}>
                      <img
                        src={profileImageUrl || '/src/assets/user.webp'}
                        alt='Profile'
                        className={styles.profileAvatar}
                      />
                      <span className={styles.profileUsername}>
                        {profile?.username}
                      </span>
                      <div className={styles.verifiedBadge}>✓</div>
                    </div>
                    <span className={styles.userId}>{profile?.id}</span>
                  </div>
                </div>

                <div className={styles.cardNotchBottom}></div>
              </div>

              <button onClick={downloadQRCode} className={styles.saveCardBtn}>
                Save Card
              </button>
            </div>
          ) : (
            <div className={styles.errorContainer}>
              <p>Failed to generate QR code. Please try again.</p>
              <button onClick={generateQRCode} className={styles.retryBtn}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
