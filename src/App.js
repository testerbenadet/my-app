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
      const growthbook = new GrowthBook({
        apiHost: 'https://cdn.growthbook.io',
        clientKey: 'sdk-kBW0vcs9lDPHZcsS', // Replace with your actual client key
        enableDevMode: true,
        trackingCallback: (experiment, result) => {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'experiment_viewed',
            experiment_id: experiment.key,
            variation_id: result.key,
          });
        },
      });

      const user_pseudo_id = getGACookie() || 'default_id';
            // Access the user's IP address from the injected global variable
      const userIp = window.USER_IP_ADDRESS || '';
      const isAdmin = userIp === '52.19.15.25'; // Replace with your admin IP address

      // Set attributes, including the admin attribute
      growthbook.setAttributes({
        user_pseudo_id,
        admin: isAdmin,
      });

      growthbook.loadFeatures().then(() => {
        setGb(growthbook); // Update the GrowthBook instance with loaded features
      });
    };

    // Function to handle consent acceptance
    const onConsentAccepted = () => {
      if (hasStatisticsConsent()) {
        initGrowthBook();
      }
    };

    // Function to handle consent decline
    const onConsentDeclined = () => {
      // Reset GrowthBook to a default instance without features
      setGb(new GrowthBook());
    };

    // Add event listeners for Cookiebot events
    window.addEventListener('CookiebotOnConsentReady', onConsentAccepted);
    window.addEventListener('CookiebotOnAccept', onConsentAccepted);
    window.addEventListener('CookiebotOnDecline', onConsentDeclined);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('CookiebotOnConsentReady', onConsentAccepted);
      window.removeEventListener('CookiebotOnAccept', onConsentAccepted);
      window.removeEventListener('CookiebotOnDecline', onConsentDeclined);
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
        </header>
      </div>
    </GrowthBookProvider>
  );
}

function CTAButton() {
  // Get the feature flag status
  const isBuyNowEnabled = useFeatureIsOn('buy-now-atc');

  // Click handler
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
