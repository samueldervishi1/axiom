import { useState, useEffect } from 'react';
import { Modal, Button, Alert, ProgressBar } from 'react-bootstrap';
import { FaExclamationTriangle, FaShieldAlt, FaClock } from 'react-icons/fa';
import styles from '../styles/rateLimitBlocker.module.css';

const RateLimitBlocker = ({
  isBlocked,
  remainingTime,
  formattedRemainingTime,
  onReset,
  getRequestStats,
  getVisitStats,
  onForceUnblock,
}) => {
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [visitStats, setVisitStats] = useState(null);

  useEffect(() => {
    if (showStats) {
      if (getRequestStats) {
        setStats(getRequestStats());
      }
      if (getVisitStats) {
        setVisitStats(getVisitStats());
      }
    }
  }, [showStats, getRequestStats, getVisitStats]);

  const calculateProgress = () => {
    const totalBlockTime = 2 * 60; // 2 minutes in seconds
    const progress = ((totalBlockTime - remainingTime) / totalBlockTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (!isBlocked) return null;

  return (
    <Modal
      show={isBlocked}
      backdrop='static'
      keyboard={false}
      centered
      className={styles.rateLimitModal}
    >
      <Modal.Header className={styles.modalHeader}>
        <div className={styles.headerContent}>
          <FaShieldAlt className={styles.shieldIcon} />
          <Modal.Title className={styles.modalTitle}>
            Suspicious Activity Detected
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className={styles.modalBody}>
        <Alert variant='warning' className={styles.warningAlert}>
          <FaExclamationTriangle className={styles.warningIcon} />
          <div>
            <strong>Access Temporarily Restricted</strong>
            <p className={styles.warningText}>
              We detected unusually high activity from your session. This could
              be due to:
            </p>
            <ul className={styles.reasonsList}>
              <li>Too many page refreshes in a short time</li>
              <li>Very rapid navigation between pages</li>
              <li>Automated browsing behavior</li>
            </ul>
          </div>
        </Alert>

        <div className={styles.countdownSection}>
          <div className={styles.timeDisplay}>
            <FaClock className={styles.clockIcon} />
            <span className={styles.timeText}>Time remaining:</span>
            <span className={styles.timeValue}>{formattedRemainingTime}</span>
          </div>

          <ProgressBar
            now={calculateProgress()}
            className={styles.progressBar}
            variant='info'
          />

          <p className={styles.progressText}>
            Access will be restored automatically when the timer reaches zero.
          </p>

          {/* Special message for users with long blocks */}
          {remainingTime > 150 && ( // More than 2.5 minutes = old 10-minute block
            <Alert variant='info' className={styles.migrationAlert}>
              <strong>Notice:</strong> You have an old longer block. We've
              reduced the timeout to 2 minutes.
              <br />
              <Button
                variant='primary'
                size='sm'
                onClick={onForceUnblock}
                className={styles.unblockButton}
              >
                Apply New 2-Minute Policy Now
              </Button>
            </Alert>
          )}
        </div>

        <div className={styles.instructionsSection}>
          <h6 className={styles.instructionsTitle}>What can you do?</h6>
          <ul className={styles.instructionsList}>
            <li>Wait for the countdown to complete</li>
            <li>Avoid refreshing this page repeatedly</li>
            <li>Use the application normally once access is restored</li>
            <li>Contact support if you believe this is an error</li>
          </ul>
        </div>

        {onReset && (
          <div className={styles.debugSection}>
            <Button
              variant='outline-secondary'
              size='sm'
              onClick={() => setShowStats(!showStats)}
              className={styles.debugButton}
            >
              {showStats ? 'Hide' : 'Show'} Debug Info
            </Button>

            {showStats && (stats || visitStats) && (
              <div className={styles.statsSection}>
                {stats && (
                  <>
                    <h6>Request Statistics:</h6>
                    <ul className={styles.statsList}>
                      <li>
                        Requests last minute: {stats.requestsLastMinute}/
                        {stats.maxPerMinute}
                      </li>
                      <li>
                        Requests last hour: {stats.requestsLastHour}/
                        {stats.maxPerHour}
                      </li>
                      <li>Total requests: {stats.totalRequests}</li>
                    </ul>
                  </>
                )}

                {visitStats && (
                  <>
                    <h6>Page Visit Statistics:</h6>
                    <ul className={styles.statsList}>
                      <li>Recent visits (5 min): {visitStats.recentVisits}</li>
                      <li>Hourly visits: {visitStats.hourlyVisits}</li>
                      <li>Page refreshes: {visitStats.refreshCount}</li>
                      <li>Navigations: {visitStats.navigationCount}</li>
                      <li>
                        Suspicious activity:{' '}
                        {visitStats.suspiciousActivity ? 'Yes' : 'No'}
                      </li>
                    </ul>
                  </>
                )}

                <Button
                  variant='danger'
                  size='sm'
                  onClick={onReset}
                  className={styles.resetButton}
                >
                  Reset Rate Limit (Debug)
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className={styles.modalFooter}>
        <div className={styles.footerText}>
          <small className={styles.supportText}>
            If you continue to experience issues, please contact our support
            team.
          </small>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default RateLimitBlocker;
