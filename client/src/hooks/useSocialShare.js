import { useState } from 'react';

export const useSocialShare = () => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleSocialShare = (platform, content, getShareUrl) => {
    const url = getShareUrl();
    const text = `Check out this post: ${content.substring(0, 100)}${
      content.length > 100 ? '...' : ''
    }`;
    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          text + ' ' + url
        )}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  return {
    handleSocialShare,
    showShareMenu,
    setShowShareMenu,
  };
};
