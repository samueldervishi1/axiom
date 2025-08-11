import { useState, useCallback, memo } from 'react';
import axios from 'axios';
import styles from '../styles/easterEggDoodle.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const zodiacSigns = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const devEndpoints = [
  'easter-egg',
  'server-mood',
  'should-i-deploy',
  'rubber-duck',
];

const ZodiacInput = memo(({ value, onChange, onSubmit, disabled }) => (
  <input
    type='text'
    placeholder='Enter your zodiac sign (e.g., taurus, leo)'
    value={value}
    onChange={onChange}
    className={styles.zodiac_input}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        onSubmit(e.target.value);
      }
    }}
    disabled={disabled}
  />
));

const DevApiEasterEgg = ({ onClose }) => {
  const [currentApi, setCurrentApi] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zodiacSign, setZodiacSign] = useState('');

  const getRandomEndpoint = useCallback(() => {
    return devEndpoints[Math.floor(Math.random() * devEndpoints.length)];
  }, []);

  const fetchHoroscope = useCallback(async (sign) => {
    const normalizedSign = sign.toLowerCase().trim();
    if (!zodiacSigns.includes(normalizedSign)) {
      setCurrentApi({
        endpoint: `dev/horoscope/${sign}`,
        data: {
          error: 'Invalid zodiac sign',
          message: `"${sign}" is not a valid zodiac sign. Please use: ${zodiacSigns.join(', ')}`,
          valid_signs: zodiacSigns,
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}dev/horoscope/${normalizedSign}`,
        {
          withCredentials: true,
        }
      );
      setCurrentApi({
        endpoint: `dev/horoscope/${normalizedSign}`,
        data: response.data,
      });
    } catch (error) {
      console.error('Failed to fetch horoscope:', error);
      setCurrentApi({
        endpoint: `dev/horoscope/${normalizedSign}`,
        data: { error: 'Failed to fetch horoscope data' },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRandomApi = useCallback(async () => {
    setIsLoading(true);

    const randomEndpoint = getRandomEndpoint();

    try {
      const response = await axios.get(`${API_URL}dev/${randomEndpoint}`, {
        withCredentials: true,
      });
      setCurrentApi({
        endpoint: `dev/${randomEndpoint}`,
        data: response.data,
      });
    } catch (error) {
      console.error('Failed to fetch dev API:', error);
      setCurrentApi({
        endpoint: `dev/${randomEndpoint}`,
        data: { error: 'Failed to fetch API data' },
      });
    } finally {
      setIsLoading(false);
    }
  }, [getRandomEndpoint]);

  const renderApiResponse = () => {
    if (isLoading) {
      return (
        <div className={styles.loading_container}>
          <div className={styles.loading_spinner}></div>
          <p>Calling random dev API...</p>
        </div>
      );
    }

    if (!currentApi) {
      return (
        <div className={styles.welcome_container}>
          <h3>Developer API Explorer</h3>
          <p>Discover hidden developer endpoints!</p>

          <div className={styles.api_options}>
            <button className={styles.fetch_button} onClick={fetchRandomApi}>
              Call Random Dev API
            </button>

            <div className={styles.horoscope_section}>
              <p className={styles.horoscope_label}>
                Or get your developer horoscope:
              </p>
              <div className={styles.horoscope_input_group}>
                <ZodiacInput
                  value={zodiacSign}
                  onChange={(e) => setZodiacSign(e.target.value)}
                  onSubmit={fetchHoroscope}
                  disabled={isLoading}
                />
                <button
                  className={styles.horoscope_button}
                  onClick={() =>
                    zodiacSign.trim() && fetchHoroscope(zodiacSign)
                  }
                  disabled={!zodiacSign.trim()}
                >
                  Get Horoscope
                </button>
              </div>
              <p className={styles.zodiac_hint}>
                Valid signs: aries, taurus, gemini, cancer, leo, virgo, libra,
                scorpio, sagittarius, capricorn, aquarius, pisces
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.api_response}>
        <div className={styles.api_header}>
          <span className={styles.method}>GET</span>
          <span className={styles.endpoint}>/{currentApi.endpoint}</span>
          <span className={styles.status}>200 OK</span>
        </div>

        <div className={styles.response_body}>
          <pre>{JSON.stringify(currentApi.data, null, 2)}</pre>
        </div>

        <div className={styles.api_actions}>
          <button className={styles.fetch_button} onClick={fetchRandomApi}>
            Try Another API
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.easter_egg_overlay}>
      <div className={styles.api_container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Secret Dev APIs</h2>
          <button className={styles.close_button} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content_area}>{renderApiResponse()}</div>

        <div className={styles.footer}>
          <p>Discovered hidden developer endpoints!</p>
          <p className={styles.hint}>
            Built with ☕ and late-night coding sessions
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevApiEasterEgg;
