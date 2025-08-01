import { useState, useEffect } from 'react';
import styles from '../styles/ExplorePage.module.css';

const ExplorePage = () => {
  const [articles, setArticles] = useState([]);
  const [nasaData, setNasaData] = useState([]);
  const [marsPhotos, setMarsPhotos] = useState([]);
  const [asteroids, setAsteroids] = useState([]);
  const [activeTab, setActiveTab] = useState('news');
  const [spaceFilter, setSpaceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
    fetchNasaData();
    fetchMarsPhotos();
    fetchAsteroids();
  }, []);

  const fetchNews = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_NEWS_BASE_URL}/top-headlines?country=us&apiKey=${import.meta.env.VITE_NEWS_API_KEY}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        const rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (jsonError) {
        throw new Error('Unable to parse response. Please try again later.');
      }

      if (!data || !Array.isArray(data.articles)) {
        throw new Error('Invalid response format. Please try again later.');
      }
      setArticles(data.articles);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again later.');
    }
  };

  const fetchNasaData = async () => {
    try {
      // Fetch APOD (Astronomy Picture of the Day) for the last 7 days
      const responses = await Promise.all([
        // Current day
        fetch(
          `${import.meta.env.VITE_NASA_BASE_URL}/planetary/apod?api_key=${import.meta.env.VITE_NASA_API_KEY}`
        ),
        // Past few days
        ...Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (i + 1));
          const dateStr = date.toISOString().split('T')[0];
          return fetch(
            `${import.meta.env.VITE_NASA_BASE_URL}/planetary/apod?api_key=${import.meta.env.VITE_NASA_API_KEY}&date=${dateStr}`
          );
        }),
      ]);

      const nasaItems = await Promise.all(
        responses.map(async (response) => {
          if (response.ok) {
            return await response.json();
          }
          return null;
        })
      );

      const apodData = nasaItems
        .filter((item) => item !== null)
        .map((item) => ({
          ...item,
          type: 'apod',
          source: 'NASA APOD',
        }));

      setNasaData(apodData);
    } catch (err) {
      console.error('NASA APOD API error:', err);
    }
  };

  const fetchMarsPhotos = async () => {
    try {
      // Try Curiosity first with a specific recent sol
      const curiosityResponse = await fetch(
        `${import.meta.env.VITE_NASA_BASE_URL}/mars-photos/api/v1/rovers/curiosity/photos?sol=4000&api_key=${import.meta.env.VITE_NASA_API_KEY}`
      );

      const marsData = [];

      if (curiosityResponse.ok) {
        const curiosityData = await curiosityResponse.json();
        if (curiosityData.photos && curiosityData.photos.length > 0) {
          const curiosityPhotos = curiosityData.photos
            .slice(0, 6)
            .map((photo) => ({
              id: photo.id,
              img_src: photo.img_src,
              earth_date: photo.earth_date,
              rover: photo.rover.name,
              camera: photo.camera.full_name,
              sol: photo.sol,
              type: 'mars_photo',
              source: `Mars Rover ${photo.rover.name}`,
              title: `Mars Photo by ${photo.rover.name} - Sol ${photo.sol}`,
              explanation: `Photo taken by ${photo.rover.name} rover on Sol ${photo.sol} (${photo.earth_date}) using ${photo.camera.full_name} camera.`,
            }));
          marsData.push(...curiosityPhotos);
        }
      }

      // If Curiosity didn't work, try a fallback sol
      if (marsData.length === 0) {
        try {
          const fallbackResponse = await fetch(
            `${import.meta.env.VITE_NASA_BASE_URL}/mars-photos/api/v1/rovers/curiosity/photos?sol=3000&camera=MAST&api_key=${import.meta.env.VITE_NASA_API_KEY}`
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.photos && fallbackData.photos.length > 0) {
              const fallbackPhotos = fallbackData.photos
                .slice(0, 6)
                .map((photo) => ({
                  id: photo.id,
                  img_src: photo.img_src,
                  earth_date: photo.earth_date,
                  rover: photo.rover.name,
                  camera: photo.camera.full_name,
                  sol: photo.sol,
                  type: 'mars_photo',
                  source: `Mars Rover ${photo.rover.name}`,
                  title: `Mars Photo by ${photo.rover.name} - Sol ${photo.sol}`,
                  explanation: `Photo taken by ${photo.rover.name} rover on Sol ${photo.sol} (${photo.earth_date}) using ${photo.camera.full_name} camera.`,
                }));
              marsData.push(...fallbackPhotos);
            }
          }
        } catch (fallbackErr) {
          console.error('Mars Photos fallback error:', fallbackErr);
        }
      }

      console.log('Mars photos fetched:', marsData.length);
      setMarsPhotos(marsData);
    } catch (err) {
      console.error('Mars Photos API error:', err);
    }
  };

  const fetchAsteroids = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${import.meta.env.VITE_NASA_BASE_URL}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${import.meta.env.VITE_NASA_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        const asteroidsToday = data.near_earth_objects[today] || [];

        const asteroidData = asteroidsToday.slice(0, 8).map((asteroid) => ({
          id: asteroid.id,
          name: asteroid.name,
          diameter_min:
            asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(
              3
            ),
          diameter_max:
            asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(
              3
            ),
          is_potentially_hazardous: asteroid.is_potentially_hazardous_asteroid,
          close_approach_date:
            asteroid.close_approach_data[0]?.close_approach_date_full,
          miss_distance_km: parseInt(
            asteroid.close_approach_data[0]?.miss_distance.kilometers
          ).toLocaleString(),
          velocity_kmh: parseInt(
            asteroid.close_approach_data[0]?.relative_velocity
              .kilometers_per_hour
          ).toLocaleString(),
          type: 'asteroid',
          source: 'NASA NEO',
          title: `Asteroid ${asteroid.name}`,
          explanation: `${asteroid.name} is ${asteroid.is_potentially_hazardous_asteroid ? 'a potentially hazardous' : 'an'} asteroid with an estimated diameter of ${asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)}-${asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)} km. It will make its closest approach at ${asteroid.close_approach_data[0]?.miss_distance.kilometers ? parseInt(asteroid.close_approach_data[0].miss_distance.kilometers).toLocaleString() : 'unknown'} km from Earth.`,
        }));

        setAsteroids(asteroidData);
      }
    } catch (err) {
      console.error('Asteroids API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openArticle = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderNewsContent = () => (
    <div className={styles.postsContainer}>
      {articles.length === 0 ? (
        <div className={styles.noPosts}>No news articles found</div>
      ) : (
        articles.map((article, index) => (
          <div key={index} className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postMeta}>
                <span className={styles.postDate}>
                  {formatDate(article.publishedAt)}
                </span>
                {article.source && (
                  <span className={styles.source}>{article.source.name}</span>
                )}
              </div>
            </div>

            {article.urlToImage && (
              <div className={styles.articleImage}>
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className={styles.postContent}>
              <h3 className={styles.articleTitle}>{article.title}</h3>
              {article.description && (
                <p className={styles.articleDescription}>
                  {article.description}
                </p>
              )}
              {article.author && (
                <p className={styles.articleAuthor}>By {article.author}</p>
              )}
            </div>

            <div className={styles.postActions}>
              <button
                className={`${styles.actionBtn} ${styles.readBtn}`}
                onClick={() => openArticle(article.url)}
              >
                <span className={styles.icon}>Read Full Article</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const getAllSpaceContent = () => {
    const allContent = [...nasaData, ...marsPhotos, ...asteroids];

    if (spaceFilter === 'all') return allContent;
    return allContent.filter((item) => item.type === spaceFilter);
  };

  const renderSpaceItem = (item, index) => {
    const key = `${item.type}-${item.id || index}`;

    if (item.type === 'asteroid') {
      return (
        <div key={key} className={styles.postCard}>
          <div className={styles.postHeader}>
            <div className={styles.postMeta}>
              <span className={styles.postDate}>
                {formatDate(item.close_approach_date)}
              </span>
              <span
                className={`${styles.source} ${item.is_potentially_hazardous ? styles.hazardous : ''}`}
              >
                {item.is_potentially_hazardous ? '⚠️ NASA NEO' : '🌌 NASA NEO'}
              </span>
            </div>
          </div>

          <div className={styles.asteroidIcon}>
            <div className={styles.asteroidVisual}>🌑</div>
          </div>

          <div className={styles.postContent}>
            <h3 className={styles.articleTitle}>{item.title}</h3>
            <p className={styles.articleDescription}>{item.explanation}</p>

            <div className={styles.asteroidStats}>
              <div className={styles.stat}>
                <strong>Diameter:</strong> {item.diameter_min}-
                {item.diameter_max} km
              </div>
              <div className={styles.stat}>
                <strong>Miss Distance:</strong> {item.miss_distance_km} km
              </div>
              <div className={styles.stat}>
                <strong>Velocity:</strong> {item.velocity_kmh} km/h
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'mars_photo') {
      return (
        <div key={key} className={styles.postCard}>
          <div className={styles.postHeader}>
            <div className={styles.postMeta}>
              <span className={styles.postDate}>
                {formatDate(item.earth_date)}
              </span>
              <span className={styles.source}>🔴 {item.source}</span>
            </div>
          </div>

          <div className={styles.articleImage}>
            <img
              src={item.img_src}
              alt={item.title}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className={styles.postContent}>
            <h3 className={styles.articleTitle}>{item.title}</h3>
            <p className={styles.articleDescription}>{item.explanation}</p>
            <div className={styles.marsInfo}>
              <span>
                <strong>Camera:</strong> {item.camera}
              </span>
            </div>
          </div>

          <div className={styles.postActions}>
            <button
              className={`${styles.actionBtn} ${styles.readBtn}`}
              onClick={() => openArticle(item.img_src)}
            >
              <span className={styles.icon}>View Full Image</span>
            </button>
          </div>
        </div>
      );
    }

    // APOD content
    return (
      <div key={key} className={styles.postCard}>
        <div className={styles.postHeader}>
          <div className={styles.postMeta}>
            <span className={styles.postDate}>{formatDate(item.date)}</span>
            <span className={styles.source}>⭐ {item.source}</span>
          </div>
        </div>

        {item.media_type === 'image' && item.url && (
          <div className={styles.articleImage}>
            <img
              src={item.url}
              alt={item.title}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {item.media_type === 'video' && item.url && (
          <div className={styles.articleImage}>
            <iframe
              src={item.url}
              title={item.title}
              width='100%'
              height='300'
              style={{ border: 'none' }}
              allowFullScreen
            />
          </div>
        )}

        <div className={styles.postContent}>
          <h3 className={styles.articleTitle}>{item.title}</h3>
          {item.explanation && (
            <p className={styles.articleDescription}>{item.explanation}</p>
          )}
          {item.copyright && (
            <p className={styles.articleAuthor}>© {item.copyright}</p>
          )}
        </div>

        {item.hdurl && (
          <div className={styles.postActions}>
            <button
              className={`${styles.actionBtn} ${styles.readBtn}`}
              onClick={() => openArticle(item.hdurl)}
            >
              <span className={styles.icon}>View HD Image</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNasaContent = () => {
    const spaceContent = getAllSpaceContent();

    return (
      <div>
        <div className={styles.spaceFilters}>
          <button
            className={`${styles.filterBtn} ${spaceFilter === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setSpaceFilter('all')}
          >
            🌌 All Space
          </button>
          <button
            className={`${styles.filterBtn} ${spaceFilter === 'apod' ? styles.activeFilter : ''}`}
            onClick={() => setSpaceFilter('apod')}
          >
            ⭐ Daily Pictures
          </button>
          <button
            className={`${styles.filterBtn} ${spaceFilter === 'mars_photo' ? styles.activeFilter : ''}`}
            onClick={() => setSpaceFilter('mars_photo')}
          >
            🔴 Mars Photos
          </button>
          <button
            className={`${styles.filterBtn} ${spaceFilter === 'asteroid' ? styles.activeFilter : ''}`}
            onClick={() => setSpaceFilter('asteroid')}
          >
            🌑 Asteroids
          </button>
        </div>

        <div className={styles.postsContainer}>
          {spaceContent.length === 0 ? (
            <div className={styles.noPosts}>No space content found</div>
          ) : (
            spaceContent.map((item, index) => renderSpaceItem(item, index))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.explorePage}>
        <div className={styles.loading}>Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.explorePage}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.explorePage}>
      <div className={styles.exploreHeader}>
        <h1>Explore</h1>
        <p>Stay updated with the latest news and space discoveries</p>

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'news' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('news')}
          >
            📰 News
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'space' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('space')}
          >
            🚀 Space
          </button>
        </div>
      </div>

      {activeTab === 'news' ? renderNewsContent() : renderNasaContent()}
    </div>
  );
};

export default ExplorePage;
