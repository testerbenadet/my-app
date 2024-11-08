import React from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

function useGrowthBook() {
  const [gb, setGb] = React.useState(() => new GrowthBook());
  const [initialized, setInitialized] = React.useState(false);
  const viewedExperiments = React.useRef(new Set()); // Track viewed experiments

  React.useEffect(() => {
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

    const hasStatisticsConsent = () => {
      const consentCookie = document.cookie;
      const hasConsent = consentCookie && consentCookie.includes('statistics:true');
      console.log("Has statistics consent:", hasConsent); // Log consent status
      return hasConsent;
    };

    const initGrowthBook = () => {
      const hasConsent = hasStatisticsConsent();

      const growthbook = new GrowthBook({
        apiHost: 'https://cdn.growthbook.io',
        clientKey: 'sdk-kBW0vcs9lDPHZcsS',
        enableDevMode: true,
        enabled: hasConsent, // Enable experiments based on consent status
      });

      if (hasConsent) {
        // If the user has consented, set tracking callback
        growthbook.setTrackingCallback((experiment, result) => {
          if (!viewedExperiments.current.has(experiment.key)) {
            console.log("Tracking experiment:", experiment.key, "with variation:", result.key); // Log tracking callback execution
            viewedExperiments.current.add(experiment.key); // Add experiment to viewed set

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: 'experiment_viewed',
              experiment_id: experiment.key,
              variation_id: result.key,
            });
          }
        });

        const user_pseudo_id = getGACookie() || 'default_id';

        growthbook.setAttributes({
          user_pseudo_id,
        });
      } else {
        growthbook.setAttributes({
          consent: false,
        });
      }

      growthbook.loadFeatures().then(() => {
        setGb(growthbook); // Update the GrowthBook instance with loaded features
        setInitialized(true); // Mark GrowthBook as initialized
      });
    };

    if (!initialized) {
      initGrowthBook(); // Initialize only if not already initialized
    }

    const onConsentChanged = () => {
      initGrowthBook(); // Reinitialize GrowthBook on consent change
    };

    window.addEventListener('CookiebotOnConsentReady', onConsentChanged);
    window.addEventListener('CookiebotOnAccept', onConsentChanged);
    window.addEventListener('CookiebotOnDecline', onConsentChanged);

    return () => {
      window.removeEventListener('CookiebotOnConsentReady', onConsentChanged);
      window.removeEventListener('CookiebotOnAccept', onConsentChanged);
      window.removeEventListener('CookiebotOnDecline', onConsentChanged);
    };
  }, [initialized]);

  return gb;
}

export default function App() {
  const gb = useGrowthBook(); // Use the custom hook to get the GrowthBook instance

  return (
    <GrowthBookProvider growthbook={gb}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Hello, my name is Nick</h1>
          <div className="button-container">
            <CTAButton />
            <ReadMoreButton />
          </div>
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
