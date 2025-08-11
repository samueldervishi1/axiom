import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FaCog,
  FaGithub,
  FaInstagram,
  FaLink,
  FaRegBookmark,
  FaRegCommentAlt,
  FaRegEyeSlash,
  FaRegThumbsUp,
} from 'react-icons/fa';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import { FaPen } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from '../styles/profile.module.css';
import profileAvatar from '../assets/user.webp';
import backgroundImage from '../assets/background.jpg';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [, setLikedPosts] = useState([]);
  const [likedPostsContent, setLikedPostsContent] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Helper function to generate color variations
  const generateColorVariations = (hexColor) => {
    if (!hexColor) return {};

    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return {
      primary: hexColor,
      light: `rgba(${r}, ${g}, ${b}, 0.1)`,
      medium: `rgba(${r}, ${g}, ${b}, 0.3)`,
      gradient: `linear-gradient(135deg, ${hexColor}40, ${hexColor}10)`,
      shadow: `0 4px 20px rgba(${r}, ${g}, ${b}, 0.3)`,
      border: `2px solid ${hexColor}40`,
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const username = await getUsernameFromServer();
        const userId = await getUserIdFromServer();

        const [profileResponse, userPostsResponse, likedResponse] =
          await Promise.all([
            axios.get(`${API_URL}users/lookup/${username}`, {
              withCredentials: true,
            }),
            axios.get(`${API_URL}posts/user/${userId}`, {
              withCredentials: true,
            }),
            axios.get(`${API_URL}posts/likes/user/${userId}`, {
              withCredentials: true,
            }),
          ]);

        setProfile(profileResponse.data);
        setUserPosts(userPostsResponse.data.filter((post) => !post.deleted));
        setLikedPosts(likedResponse.data);

        if (likedResponse.data && likedResponse.data.likedPosts) {
          const likedPostsFiltered = likedResponse.data.likedPosts.filter(
            (post) => !post.deleted
          );
          setLikedPostsContent(likedPostsFiltered);
        } else {
          setLikedPostsContent([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLinkName = (link) => {
    try {
      const url = new URL(link);
      const hostname = url.hostname.replace(/^www\./, '');

      if (hostname === 'github.com') {
        return 'GitHub';
      } else if (hostname === 'instagram.com') {
        return 'Instagram';
      } else if (hostname === 'linkedin.com') {
        return 'LinkedIn';
      } else if (hostname === 'twitter.com' || hostname === 'x.com') {
        return 'Twitter';
      } else {
        return hostname;
      }
    } catch (error) {
      console.error('Error getting link name:', error);
      return 'Website';
    }
  };

  const getFollowersCount = () => {
    return profile?.followers?.length || 0;
  };

  const getFollowingCount = () => {
    return profile?.following?.length || 0;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <p>Could not load profile. Please try again later.</p>
      </div>
    );
  }

  const colorVariations = generateColorVariations(profile.profileColorHex);

  // const dynamicStyles = {
  //   profileContainer: {
  //     background: colorVariations.gradient,
  //     minHeight: '100vh',
  //     borderRadius: '30px',
  //     marginTop: '10px',
  //     marginBottom: '10px',
  //   },
  //   activeTab: {
  //     borderBottom: `3px solid ${colorVariations.primary}`,
  //     color: colorVariations.primary,
  //   },
  //   avatar: {
  //     border: colorVariations.border,
  //     boxShadow: colorVariations.shadow,
  //   },
  //   aboutCard: {
  //     background: colorVariations.light,
  //     border: `1px solid ${colorVariations.primary}20`,
  //   },
  //   bannerOverlay: {
  //     background: `linear-gradient(45deg, ${colorVariations.primary}60, transparent)`,
  //   },
  //   username: {
  //     color: colorVariations.primary,
  //     fontWeight: 'bold',
  //   },
  //   statHighlight: {
  //     color: colorVariations.primary,
  //   },
  //   postCard: {
  //     borderLeft: `4px solid ${colorVariations.primary}`,
  //     background: colorVariations.light,
  //   },
  // };

  const dynamicStyles = {
    profileContainer: {
      background: `
      ${colorVariations.gradient},
      linear-gradient(135deg, 
        rgba(255, 255, 255, 0.05) 0%,
        transparent 50%,
        rgba(255, 255, 255, 0.05) 100%
      ),
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)
    `,
      minHeight: '100vh',
      borderRadius: '12px',
      marginTop: '10px',
      marginBottom: '10px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: `
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px) scale(1.002)',
        boxShadow: `
        0 32px 64px -12px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15)
      `,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
        radial-gradient(circle at 20% 50%, ${colorVariations.primary}30 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, ${colorVariations.primary}20 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, ${colorVariations.primary}25 0%, transparent 50%)
      `,
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: -1,
      },
    },

    activeTab: {
      borderBottom: `3px solid ${colorVariations.primary}`,
      color: colorVariations.primary,
      boxShadow: `0 4px 8px ${colorVariations.primary}20`,
      transition: 'all 0.2s ease',
    },

    avatar: {
      border: colorVariations.border,
      boxShadow: `
      ${colorVariations.shadow},
      0 0 20px ${colorVariations.primary}30
    `,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: `
        ${colorVariations.shadow},
        0 0 30px ${colorVariations.primary}50
      `,
      },
    },

    aboutCard: {
      background: `
      ${colorVariations.light},
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)
    `,
      border: `1px solid ${colorVariations.primary}20`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '15px',
      transition: 'all 0.3s ease',
      '&:hover': {
        border: `1px solid ${colorVariations.primary}40`,
        transform: 'translateY(-2px)',
        boxShadow: `0 10px 25px rgba(0, 0, 0, 0.1)`,
      },
    },

    bannerOverlay: {
      background: `
      linear-gradient(45deg, ${colorVariations.primary}60, transparent),
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)
    `,
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    },

    username: {
      color: colorVariations.primary,
      fontWeight: 'bold',
      textShadow: `0 2px 4px ${colorVariations.primary}20`,
      transition: 'all 0.2s ease',
    },

    statHighlight: {
      color: colorVariations.primary,
      textShadow: `0 1px 2px ${colorVariations.primary}30`,
      transition: 'all 0.2s ease',
    },

    postCard: {
      borderLeft: `4px solid ${colorVariations.primary}`,
      background: `
      ${colorVariations.light},
      linear-gradient(90deg, ${colorVariations.primary}05 0%, transparent 100%)
    `,
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderLeft: `6px solid ${colorVariations.primary}`,
        transform: 'translateX(4px)',
        boxShadow: `0 8px 25px rgba(0, 0, 0, 0.1)`,
      },
    },
  };

  return (
    <div
      className={styles.profileContainer}
      style={dynamicStyles.profileContainer}
    >
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.profileCard}>
            {/* Banner Section */}
            <div className={styles.profileBanner}>
              <img
                src={backgroundImage}
                alt='Profile Banner'
                className={styles.bannerImg}
              />
            </div>

            {/* Profile Content */}
            <div className={styles.profileContent}>
              {/* Avatar */}
              <div className={styles.avatarContainer}>
                <img
                  src={profileAvatar}
                  alt='Profile'
                  className={styles.profileAvatar}
                />
              </div>

              {/* User Info */}
              <div className={styles.userInfo}>
                <h1 className={styles.displayName}>
                  {profile.fullName || profile.displayName || profile.username}
                </h1>

                {/* Bio and Profession */}
                {(profile.bio || profile.profession) && (
                  <p className={styles.bioText}>
                    {profile.bio && profile.profession
                      ? `${profile.bio} - ${profile.profession}`
                      : profile.bio || profile.profession}
                  </p>
                )}

                {/* Links */}
                {profile.links && profile.links.length > 0 && (
                  <div className={styles.linksSection}>
                    {profile.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.userLink}
                      >
                        {getLinkName(link)}
                        <LuSquareArrowOutUpRight className={styles.arrowIcon} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                  <button className={styles.actionBtn}>Resources</button>
                  <button className={styles.actionBtn}>App</button>
                  <button className={styles.actionBtn}>Profile</button>
                  <button className={styles.actionBtn}>Visit</button>
                </div>
              </div>
            </div>
          </div>

          {/* About Card */}
          <div className={styles.aboutCard}>
            <div className={styles.aboutHeader}>
              <h3 className={styles.aboutTitle}>About</h3>
              <button
                className={styles.editBtn}
                onClick={() => console.log('Edit about clicked')}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.aboutContent}>
              {profile.bio ? (
                <p className={styles.aboutText}>{profile.bio}</p>
              ) : (
                <p className={styles.aboutPlaceholder}>
                  Tell us about yourself...
                </p>
              )}
            </div>
          </div>

          {/* Experience Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Experience</h3>
              <button
                className={styles.editBtn}
                onClick={() => console.log('Edit experience clicked')}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.sectionContent}>
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp, index) => (
                  <div key={index} className={styles.experienceItem}>
                    <h4 className={styles.expPosition}>{exp.position}</h4>
                    <p className={styles.expCompany}>
                      {exp.company} • {exp.employmentType}
                    </p>
                    <p className={styles.expDate}>
                      {new Date(exp.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      -
                      {exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Present'}
                    </p>
                    <p className={styles.expLocation}>{exp.location}</p>
                    {exp.description && (
                      <p className={styles.expDescription}>{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.sectionPlaceholder}>
                  Add your work experience
                </p>
              )}
            </div>
          </div>

          {/* Education Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Education</h3>
              <button
                className={styles.editBtn}
                onClick={() => console.log('Edit education clicked')}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.sectionContent}>
              {profile.education && profile.education.length > 0 ? (
                profile.education.map((edu, index) => (
                  <div key={index} className={styles.educationItem}>
                    <h4 className={styles.eduInstitution}>{edu.institution}</h4>
                    <p className={styles.eduDegree}>
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                    <p className={styles.eduDate}>
                      {new Date(edu.startDate).getFullYear()} -{' '}
                      {new Date(edu.endDate).getFullYear()}
                    </p>
                    {edu.grade && (
                      <p className={styles.eduGrade}>Grade: {edu.grade}</p>
                    )}
                    {edu.description && (
                      <p className={styles.eduDescription}>{edu.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.sectionPlaceholder}>Add your education</p>
              )}
            </div>
          </div>

          {/* Skills Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Skills</h3>
              <button
                className={styles.editBtn}
                onClick={() => console.log('Edit skills clicked')}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.sectionContent}>
              {profile.skills && profile.skills.length > 0 ? (
                <div className={styles.skillsGrid}>
                  {profile.skills.map((skill, index) => (
                    <div key={index} className={styles.skillItem}>
                      <span className={styles.skillName}>
                        {skill.skillName}
                      </span>
                      <span className={styles.skillLevel}>
                        {skill.proficiencyLevel}
                      </span>
                      {skill.endorsementCount > 0 && (
                        <span className={styles.skillEndorsements}>
                          {skill.endorsementCount} endorsements
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.sectionPlaceholder}>Add your skills</p>
              )}
            </div>
          </div>

          {/* Certifications Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Licenses & Certifications</h3>
              <button
                className={styles.editBtn}
                onClick={() => console.log('Edit certifications clicked')}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.sectionContent}>
              {profile.certificates && profile.certificates.length > 0 ? (
                profile.certificates.map((cert, index) => (
                  <div key={index} className={styles.certificationItem}>
                    <h4 className={styles.certName}>{cert.name}</h4>
                    <p className={styles.certOrganization}>
                      {cert.issuingOrganization}
                    </p>
                    <p className={styles.certDate}>
                      Issued{' '}
                      {new Date(cert.issueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                      {cert.expirationDate &&
                        !cert.doesNotExpire &&
                        ` • Expires ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                    </p>
                    {cert.credentialId && (
                      <p className={styles.certCredential}>
                        Credential ID: {cert.credentialId}
                      </p>
                    )}
                    {cert.description && (
                      <p className={styles.certDescription}>
                        {cert.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.sectionPlaceholder}>
                  Add your certifications
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          {/* Public Profile Card */}
          <div className={styles.publicProfileCard}>
            <div className={styles.publicProfileHeader}>
              <h3 className={styles.publicProfileTitle}>
                Public profile & URL
              </h3>
            </div>
            <div className={styles.publicProfileContent}>
              <div className={styles.profileUrl}>
                <span className={styles.urlLabel}>Your profile URL:</span>
                <a
                  href={`${window.location.origin}/${profile.username}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.urlLink}
                >
                  {window.location.origin}/{profile.username}
                </a>
              </div>
              <p className={styles.profileDescription}>
                Customize your public profile URL to make it easier for others
                to find and remember.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
