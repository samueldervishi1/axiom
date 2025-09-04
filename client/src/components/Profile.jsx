import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import {
  FaPen,
  FaChevronDown,
  FaBook,
  FaTrophy,
  FaCloudDownloadAlt,
  FaShare,
  FaGamepad,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  BsFillInfoSquareFill,
  BsFillFileEarmarkPostFill,
} from 'react-icons/bs';
import { FaCrown, FaGem } from 'react-icons/fa';
import styles from '../styles/profile.module.css';
import profileAvatar from '../assets/user.webp';
import backgroundImage from '../assets/background.jpg';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';
import ExperienceModal from './ExperienceModal';
import EducationModal from './EducationModal';
import SkillModal from './SkillModal';
import CertificateModal from './CertificateModal';
import AboutModal from './AboutModal';
import AboutProfileModal from './AboutProfileModal';
import ProfileEditModal from './ProfileEditModal';
import UserPostsModal from './UserPostsModal';
import ConnectSidebar from './ConnectSidebar';
import SubscriptionCard from './SubscriptionCard';
import QRCodeModal from './QRCodeModal';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [, setUserPosts] = useState([]);
  const [, setLikedPosts] = useState([]);
  const [, setLikedPostsContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setShowDropdown] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const dropdownRef = useRef(null);

  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAboutProfileModal, setShowAboutProfileModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showUserPostsModal, setShowUserPostsModal] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [showVisitDropdown, setShowVisitDropdown] = useState(false);
  const [showMoreLinks, setShowMoreLinks] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const username = await getUsernameFromServer();
        const userId = await getUserIdFromServer();

        try {
          const profileResponse = await axios.get(
            `${API_URL}users/lookup/${username}`,
            {
              withCredentials: true,
            }
          );
          setProfile(profileResponse.data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }

        // Fetch subscription status
        try {
          const subscriptionResponse = await axios.get(
            `${API_URL}subscription/status`,
            {
              withCredentials: true,
            }
          );
          setSubscriptionStatus(subscriptionResponse.data);
        } catch (error) {
          console.warn('Failed to fetch subscription status:', error);
          setSubscriptionStatus(null);
        }

        if (userId) {
          try {
            const imageResponse = await axios.get(
              `${API_URL}profile/${userId}/image`,
              {
                responseType: 'blob',
                withCredentials: true,
              }
            );

            if (imageResponse.status === 200 && imageResponse.data.size > 0) {
              const imageUrl = URL.createObjectURL(imageResponse.data);
              setProfileImageUrl(imageUrl);
            }
          } catch (err) {
            setProfileImageUrl(null);
            throw new Error(
              `Failed to load profile image: ${err?.message || 'Unknown error'}`
            );
          }
        }

        try {
          const userPostsResponse = await axios.get(
            `${API_URL}posts/user/${userId}`,
            {
              withCredentials: true,
            }
          );

          if (userPostsResponse.data && Array.isArray(userPostsResponse.data)) {
            setUserPosts(
              userPostsResponse.data.filter((post) => !post.deleted)
            );
          } else {
            setUserPosts([]);
          }
        } catch (error) {
          console.error('Error fetching user posts:', error);
          setUserPosts([]);
        }

        try {
          const likedResponse = await axios.get(
            `${API_URL}posts/likes/user/${userId}`,
            {
              withCredentials: true,
            }
          );

          setLikedPosts(likedResponse.data);

          if (
            likedResponse.data &&
            likedResponse.data.likedPosts &&
            Array.isArray(likedResponse.data.likedPosts)
          ) {
            const likedPostsFiltered = likedResponse.data.likedPosts.filter(
              (post) => !post.deleted
            );
            setLikedPostsContent(likedPostsFiltered);
          } else {
            setLikedPostsContent([]);
          }
        } catch (error) {
          console.error('Error fetching liked posts:', error);
          setLikedPosts([]);
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
        setShowResourcesDropdown(false);
        setShowVisitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileImageUrl) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  }, []);

  const refreshProfileData = async () => {
    try {
      const [username, userId] = await Promise.all([
        getUsernameFromServer(),
        getUserIdFromServer(),
      ]);

      const profileResponse = await axios.get(
        `${API_URL}users/lookup/${username}`,
        {
          withCredentials: true,
        }
      );
      setProfile(profileResponse.data);

      try {
        const subscriptionResponse = await axios.get(
          `${API_URL}subscription/status`,
          {
            withCredentials: true,
          }
        );
        setSubscriptionStatus(subscriptionResponse.data);
      } catch (error) {
        console.warn('Failed to refresh subscription status:', error);
        setSubscriptionStatus(null);
      }

      if (userId) {
        try {
          const imageResponse = await axios.get(
            `${API_URL}profile/${userId}/image`,
            {
              responseType: 'blob',
              withCredentials: true,
            }
          );

          if (imageResponse.status === 200 && imageResponse.data.size > 0) {
            if (profileImageUrl) {
              URL.revokeObjectURL(profileImageUrl);
            }
            const imageUrl = URL.createObjectURL(imageResponse.data);
            setProfileImageUrl(imageUrl);
          }
        } catch (err) {
          if (profileImageUrl) {
            URL.revokeObjectURL(profileImageUrl);
          }
          setProfileImageUrl(null);
          throw new Error(
            `Failed to load profile image: ${err?.message || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };
  const scrollToTopAndOpenModal = (setModalFunction) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setModalFunction(true);
    }, 300);
  };

  const downloadProfilePdf = async () => {
    try {
      const userId = await getUserIdFromServer();
      const response = await axios.get(
        `${API_URL}users/${userId}/download-pdf`,
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile.username || 'profile'}_profile.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

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

  const getTopSkills = () => {
    if (!profile?.skills || profile.skills.length === 0) {
      return [];
    }

    return profile.skills
      .filter((skill) => skill.endorsementCount > 0)
      .sort((a, b) => b.endorsementCount - a.endorsementCount)
      .slice(0, 3);
  };

  // const getFollowingCount = () => {
  //   return profile?.following?.length || 0;
  // };

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

  const dynamicStyles = {
    profileContainer: {
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
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: -1,
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
            <div className={styles.profileBanner}>
              <img
                src={backgroundImage}
                alt='Profile Banner'
                className={styles.bannerImg}
              />
            </div>

            <div className={styles.profileContent}>
              <div className={styles.avatarContainer}>
                <div className={styles.profileImageContainer}>
                  <img
                    src={profileImageUrl || profileAvatar}
                    alt='Profile'
                    className={styles.profileAvatar}
                  />
                </div>
              </div>
              <button
                className={styles.profileEditBtn}
                onClick={() => scrollToTopAndOpenModal(setShowProfileEditModal)}
                title='Edit Profile'
              >
                <FaPen className={styles.penIcon} />
              </button>

              <div className={styles.userInfo}>
                <div className={styles.displayNameContainer}>
                  <h1 className={styles.displayName}>
                    {profile.fullName ||
                      profile.displayName ||
                      profile.username}
                    {profile.isVerified && (
                      <FaCheckCircle
                        className={styles.verifiedBadge}
                        title='Verified Account'
                      />
                    )}
                  </h1>
                  {subscriptionStatus?.subscriptionStatus === 'active' &&
                    (subscriptionStatus?.planType === 'pro' ||
                      subscriptionStatus?.planType === 'ultimate' ||
                      subscriptionStatus?.role === 'pro_account' ||
                      subscriptionStatus?.role === 'ultimate_account') && (
                      <div className={styles.premiumBadge}>
                        {subscriptionStatus?.planType === 'ultimate' ||
                        subscriptionStatus?.role === 'ultimate_account' ? (
                          <FaGem
                            className={styles.premiumIcon}
                            title='Ultimate Member'
                          />
                        ) : (
                          <FaCrown
                            className={styles.premiumIcon}
                            title='Pro Member'
                          />
                        )}
                      </div>
                    )}
                </div>

                {(profile.bio || profile.profession) && (
                  <p className={styles.bioText}>
                    {profile.bio && profile.title
                      ? `${profile.bio} - ${profile.title}`
                      : profile.bio || profile.title}
                  </p>
                )}

                <div className={styles.followers}>
                  {getFollowersCount()} - connections
                </div>

                <div className={styles.actionButtons}>
                  <div className={styles.dropdownContainer}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setShowResourcesDropdown(!showResourcesDropdown);
                        setShowVisitDropdown(false);
                      }}
                    >
                      Resources
                      <FaChevronDown className={styles.dropdownIcon} />
                    </button>
                    {showResourcesDropdown && (
                      <div className={styles.dropdownMenu}>
                        <div className={styles.dropdownItem}>
                          <FaBook className={styles.menuIcon} />
                          <a
                            href='/settings?section=models'
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <span>AI Documentation</span>
                          </a>
                        </div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setShowUserPostsModal(true);
                            setShowResourcesDropdown(false);
                          }}
                        >
                          <BsFillFileEarmarkPostFill
                            className={styles.menuIcon}
                          />
                          <span>Your Posts</span>
                        </div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            downloadProfilePdf();
                            setShowResourcesDropdown(false);
                          }}
                        >
                          <FaCloudDownloadAlt className={styles.menuIcon} />
                          <span>Save to PDF</span>
                        </div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setShowAboutProfileModal(true);
                            setShowResourcesDropdown(false);
                          }}
                        >
                          <BsFillInfoSquareFill className={styles.menuIcon} />
                          <span>About this profile</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.links && profile.links.length > 0 && (
                    <div className={styles.dropdownContainer}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          setShowVisitDropdown(!showVisitDropdown);
                          setShowResourcesDropdown(false);
                        }}
                      >
                        Visit
                        <FaChevronDown className={styles.dropdownIcon} />
                      </button>
                      {showVisitDropdown && (
                        <div className={styles.dropdownMenu}>
                          {profile.links
                            .slice(0, showMoreLinks ? profile.links.length : 3)
                            .map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={styles.dropdownLinkItem}
                              >
                                {getLinkName(link)}
                                <LuSquareArrowOutUpRight
                                  className={styles.menuIcon}
                                />
                              </a>
                            ))}
                          {profile.links.length > 3 && (
                            <div
                              className={styles.dropdownItem}
                              onClick={() => setShowMoreLinks(!showMoreLinks)}
                            >
                              <span>
                                {showMoreLinks
                                  ? 'Show less'
                                  : `Show ${profile.links.length - 3} more`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.aboutCard}>
            <div className={styles.aboutHeader}>
              <h3 className={styles.aboutTitle}>About</h3>
              <button
                className={styles.editBtn}
                onClick={() => scrollToTopAndOpenModal(setShowAboutModal)}
              >
                <FaPen className={styles.penIcon} />
              </button>
            </div>
            <div className={styles.aboutContent}>
              {profile.about ? (
                <p className={styles.aboutText}>{profile.about}</p>
              ) : (
                <p className={styles.aboutPlaceholder}>
                  Tell us about yourself...
                </p>
              )}

              {getTopSkills().length > 0 ? (
                <div className={styles.topSkillsSection}>
                  <div className={styles.topSkillsHeader}>
                    <FaTrophy className={styles.topSkillsIcon} />
                    <span className={styles.topSkillsLabel}>Top skills:</span>
                  </div>
                  <div className={styles.topSkillsText}>
                    {getTopSkills().map((skill, index) => (
                      <span key={index}>
                        {skill.skillName}
                        {index < getTopSkills().length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.topSkillsSection}>
                  <p className={styles.noTopSkillsMessage}>
                    Add skills to check your top skills
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Experience</h3>
              <button
                className={styles.editBtn}
                onClick={() => scrollToTopAndOpenModal(setShowExperienceModal)}
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

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Education</h3>
              <button
                className={styles.editBtn}
                onClick={() => scrollToTopAndOpenModal(setShowEducationModal)}
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

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Skills</h3>
              <button
                className={styles.editBtn}
                onClick={() => scrollToTopAndOpenModal(setShowSkillModal)}
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

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Licenses & Certifications</h3>
              <button
                className={styles.editBtn}
                onClick={() => scrollToTopAndOpenModal(setShowCertificateModal)}
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

          <div className={styles.funCard}>
            <div className={styles.funHeader}>
              <h3 className={styles.funTitle}>Fun Stuff</h3>
            </div>
            <div className={styles.funActions}>
              <button
                className={styles.funBtn}
                onClick={() => setShowQRModal(true)}
              >
                <FaShare className={styles.funIcon} />
                Share Profile
              </button>
            </div>
          </div>

          <ConnectSidebar />
          <SubscriptionCard currentSubscription={subscriptionStatus} />
        </div>
      </div>

      <ExperienceModal
        isOpen={showExperienceModal}
        onClose={() => setShowExperienceModal(false)}
        onSuccess={refreshProfileData}
      />

      <EducationModal
        isOpen={showEducationModal}
        onClose={() => setShowEducationModal(false)}
        onSuccess={refreshProfileData}
      />

      <SkillModal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        onSuccess={refreshProfileData}
      />

      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        onSuccess={refreshProfileData}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onSuccess={refreshProfileData}
        currentAbout={profile?.about}
      />

      <AboutProfileModal
        isOpen={showAboutProfileModal}
        onClose={() => setShowAboutProfileModal(false)}
        profile={profile}
      />

      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        onSuccess={refreshProfileData}
        profile={profile}
      />

      <UserPostsModal
        isOpen={showUserPostsModal}
        onClose={() => setShowUserPostsModal(false)}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        profile={profile}
        profileImageUrl={profileImageUrl}
      />
    </div>
  );
};

export default Profile;
