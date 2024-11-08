import React from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

function useGrowthBook() {
  const [gb, setGb] = React.useState(() => new GrowthBook());

  React.useEffect(() => {
    // Helper function to get the _ga cookie value
    const getGACookie = () => {
      const gaCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('_ga='));
      if (gaCookie) {
        const parts = gaCookie.split('.');
        return parts.slice(-2).join('.');
      }
      return null;
    };

    // Helper function to check if "statistics:true" is in the consent cookie
    const hasStatisticsConsent = () => {
      const consentCookie = document.cookie;
      return consentCookie && consentCookie.includes('statistics:true');
    };

    // Function to initialize GrowthBook
    const initGrowthBook = () => {
      const hasConsent = hasStatisticsConsent();

      const options = {
        apiHost: 'https://cdn.growthbook.io',
        clientKey: 'sdk-kBW0vcs9lDPHZcsS', // Replace with your actual client key
        enableDevMode: true,
        enabled: hasConsent, // Experiments are only enabled if the user has consented
      };

      if (hasConsent) {
        // If the user has consented, set tracking callback
        options.trackingCallback = (experiment, result) => {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'experiment_viewed',
            experiment_id: experiment.key,
            variation_id: result.key,
          });
        };
      }

      const growthbook = new GrowthBook(options);

      if (hasConsent) {
        const user_pseudo_id = getGACookie() || 'default_id';

        // Set attributes
        growthbook.setAttributes({
          user_pseudo_id,
        });
      } else {
        // Set attributes to prevent experiment assignment
        growthbook.setAttributes({
          consent: false, // Custom attribute to indicate no consent
        });
      }

      growthbook.loadFeatures().then(() => {
        setGb(growthbook); // Update the GrowthBook instance with loaded features
      });
    };

    // Initialize GrowthBook on component mount
    initGrowthBook();

    // Function to handle consent changes
    const onConsentChanged = () => {
      initGrowthBook();
    };

    // Add event listeners for Cookiebot events
    window.addEventListener('CookiebotOnConsentReady', onConsentChanged);
    window.addEventListener('CookiebotOnAccept', onConsentChanged);
    window.addEventListener('CookiebotOnDecline', onConsentChanged);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('CookiebotOnConsentReady', onConsentChanged);
      window.removeEventListener('CookiebotOnAccept', onConsentChanged);
      window.removeEventListener('CookiebotOnDecline', onConsentChanged);
    };
  }, []);

  return gb; // Return the GrowthBook instance
}

export default function App() {
  const gb = useGrowthBook(); // Use the custom hook to get the GrowthBook instance

  return (
    <GrowthBookProvider growthbook={gb}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Hello, my name is Nick</h1>
          <CTAButton />
          <ReadMoreButton />
        </header>
      </div>
    </GrowthBookProvider>
  );
}

function CTAButton() {
  const isBuyNowEnabled = useFeatureIsOn('buy-now-atc');

  const handleClick = () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'addToCartClick',
      buttonText: isBuyNowEnabled ? 'Buy Now!' : 'Add to Cart',
      pagePath: window.location.pathname,
    });
  };

  return (
    <button className="cta-button" onClick={handleClick}>
      {isBuyNowEnabled ? 'Buy Now!' : 'Add to Cart'}
    </button>
  );
}

function ReadMoreButton() {
  const isReadMoreEnabled = useFeatureIsOn('read-more');

  const handleReadMoreClick = () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'readMoreClick',
      buttonText: 'Read More',
      pagePath: window.location.pathname,
    });
  };

  if (!isReadMoreEnabled) return null; // Only show if the feature is enabled

  return (
    <button className="read-more-button" onClick={handleReadMoreClick}>
      Read More
    </button>
  );
}
