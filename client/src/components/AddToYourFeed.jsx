import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoInformationCircleOutline } from 'react-icons/io5';
import styles from '../styles/addToYourFeed.module.css';

const AddToYourFeed = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  const companies = [
    {
      id: 1,
      name: 'TechCorp Solutions',
      description:
        'Leading provider of innovative software solutions for enterprise businesses.',
      logo: '🏢',
    },
    {
      id: 2,
      name: 'DataVision Analytics',
      description:
        'Transforming data into actionable insights for modern organizations.',
      logo: '📊',
    },
    {
      id: 3,
      name: 'CloudSync Technologies',
      description:
        'Cloud infrastructure and DevOps solutions for scalable applications.',
      logo: '☁️',
    },
  ];

  const handleConnect = (companyName) => {
    console.log(`Connecting to ${companyName}`);
    // Here you would typically make an API call to follow/connect
  };

  const handleViewAll = () => {
    navigate('/connect');
  };

  return (
    <div className={styles.feed_container}>
      <div className={styles.header}>
        <h4>Add to your feed</h4>
        <div
          className={styles.info_icon_container}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <IoInformationCircleOutline className={styles.info_icon} />
          {showTooltip && (
            <div className={styles.tooltip}>
              Follow companies and organizations to see their latest updates in
              your feed
            </div>
          )}
        </div>
      </div>

      <div className={styles.companies_list}>
        {companies.map((company) => (
          <div key={company.id} className={styles.company_item}>
            <div className={styles.company_logo}>{company.logo}</div>
            <div className={styles.company_info}>
              <h5 className={styles.company_name}>{company.name}</h5>
              <p className={styles.company_description}>
                {company.description}
              </p>
              <button
                className={styles.connect_button}
                onClick={() => handleConnect(company.name)}
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.view_all_button} onClick={handleViewAll}>
        View all recommendations
      </button>
    </div>
  );
};

export default AddToYourFeed;
