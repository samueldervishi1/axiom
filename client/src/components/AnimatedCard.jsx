import { useState, useEffect } from 'react';
import styles from '../styles/animatedCard.module.css';

const AnimatedCard = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`${styles.card_container} ${isVisible ? styles.visible : ''}`}
    >
      <div className={styles.background_layer}>
        <div className={styles.gradient_orb}></div>
        <div className={styles.gradient_orb_secondary}></div>
      </div>

      <div className={styles.wave_background}>
        <div className={styles.particles}></div>
      </div>
      <div className={styles.floating_particles}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`${styles.particle} ${styles[`particle_${i + 1}`]}`}
          ></div>
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.glow_effect}></div>
        <div className={styles.new_badge}>
          <span className={styles.badge_text}>Latest</span>
        </div>
        <div className={styles.heading_section}>
          <h1 className={styles.main_title}>Sophia Ultimate</h1>
          <p className={styles.subtitle}>
            Next-generation AI that understands context like never before
          </p>
        </div>
        <div className={styles.features}>
          <div className={styles.feature_item}>
            <span>Advanced Reasoning</span>
          </div>
          <div className={styles.feature_item}>
            <span>Lightning Fast</span>
          </div>
          <div className={styles.feature_item}>
            <span>Context Aware</span>
          </div>
        </div>
        <div className={styles.buttons_wrapper}>
          <a href='/chat' className={styles.main_button_link}>
            <button className={styles.primary_button}>
              <span className={styles.button_text}>Start Chatting</span>
              <div className={styles.button_shine}></div>
            </button>
          </a>

          <a href='/settings?section=models' className={styles.secondary_link}>
            <button className={styles.secondary_button}>
              <span>Learn More</span>
            </button>
          </a>
        </div>
      </div>

      <div className={styles.decorative_lines}>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
      </div>
    </div>
  );
};

export default AnimatedCard;
