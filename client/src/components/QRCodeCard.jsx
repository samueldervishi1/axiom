import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaQrcode, FaDownload, FaShare } from 'react-icons/fa';
import { getUserIdFromServer } from '../auth/authUtils';
import styles from '../styles/profile.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const QRCodeCard = () => {
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

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <FaQrcode className={styles.sectionIcon} />
          Profile QR Code
        </h3>
      </div>
      <div className={styles.sectionContent}>
        {isLoading ? (
          <div className={styles.loadingSpinner}></div>
        ) : qrCodeUrl ? (
          <div className={styles.qrCodeContainer}>
            <img
              src={qrCodeUrl}
              alt='Profile QR Code'
              className={styles.qrCodeImage}
            />
            <p className={styles.qrCodeDescription}>
              Share your profile easily - others can scan this code to visit
              your page!
            </p>
            <div className={styles.qrCodeActions}>
              <button
                onClick={downloadQRCode}
                className={styles.qrCodeBtn}
                title='Download QR Code'
              >
                <FaDownload />
              </button>
              <button
                onClick={shareQRCode}
                className={styles.qrCodeBtn}
                title='Share QR Code'
              >
                <FaShare />
              </button>
              <button
                onClick={generateQRCode}
                className={styles.qrCodeBtn}
                title='Regenerate QR Code'
              >
                <FaQrcode />
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.sectionPlaceholder}>
            Failed to generate QR code. Try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default QRCodeCard;
