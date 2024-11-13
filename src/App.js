import React from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

function useGrowthBook() {
  const [gb, setGb] = React.useState(() => new GrowthBook());
  const [initialized, setInitialized] = React.useState(false);
  const viewedExperiments = React.useRef(new Set()); // Track viewed experiments
  const dataLayerEventsPushed = React.useRef(new Set()); // Track data layer events

  React.useEffect(() => {
    const setUniqueUserIdCookie = () => {
      const COOKIE_NAME = 'unique_user_id';
      let cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAME}=`));

      if (!cookieValue) {
        const uniqueId = `id_${Math.random().toString(36).substring(2, 15)}`;
        document.cookie = `${COOKIE_NAME}=${uniqueId}; path=/; max-age=31536000`; // Set cookie for 1 year
        return uniqueId;
      } else {
        return cookieValue.split('=')[1];
      }
    };

    const uniqueUserId = setUniqueUserIdCookie(); // Generate or get the unique user ID

    const hasStatisticsConsent = () => {
      const consentCookie = document.cookie;
      const hasConsent = consentCookie && consentCookie.includes('statistics:true');
      return hasConsent;
    };

    const initGrowthBook = () => {
      const growthbook = new GrowthBook({
        apiHost: 'https://cdn.growthbook.io',
        clientKey: 'sdk-kBW0vcs9lDPHZcsS',
        enableDevMode: true,
        enabled: true, // Always enable experiments, regardless of consent
      });

      // Set tracking callback for internal tracking
      growthbook.setTrackingCallback((experiment, result) => {
        if (!viewedExperiments.current.has(experiment.key)) {
          viewedExperiments.current.add(experiment.key); // Add experiment to viewed set

          // Only push to data layer if user has consented and event hasn't been pushed
          if (hasStatisticsConsent() && !dataLayerEventsPushed.current.has(experiment.key)) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: 'experiment_viewed',
              experiment_id: experiment.key,
              variation_id: result.key,
              anonymous_id: uniqueUserId,
            });
            dataLayerEventsPushed.current.add(experiment.key); // Mark as pushed
          }
        }
      });

      // Set attributes with unique user ID as UU
      growthbook.setAttributes({
        UU: uniqueUserId,
        consent: hasStatisticsConsent(), // Store consent status as an attribute if needed for other conditions
      });

      growthbook.loadFeatures().then(() => {
        setGb(growthbook); // Update the GrowthBook instance with loaded features
        setInitialized(true); // Mark GrowthBook as initialized
      });
    };

    if (!initialized) {
      initGrowthBook(); // Initialize only if not already initialized
    }

    const onConsentChanged = () => {
      if (hasStatisticsConsent()) {
        // If consent has been given, re-run the tracking callback for all viewed experiments
        viewedExperiments.current.forEach(experimentKey => {
          if (!dataLayerEventsPushed.current.has(experimentKey)) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: 'experiment_viewed',
              experiment_id: experimentKey,
              variation_id: gb.getFeatureValue(experimentKey), // Get the variation ID for the experiment
              anonymous_id: uniqueUserId,
            });
            dataLayerEventsPushed.current.add(experimentKey); // Mark as pushed
          }
        });
      }
    };

    window.addEventListener('CookiebotOnConsentReady', onConsentChanged);
    window.addEventListener('CookiebotOnAccept', onConsentChanged);
    window.addEventListener('CookiebotOnDecline', onConsentChanged);

    return () => {
      window.removeEventListener('CookiebotOnConsentReady', onConsentChanged);
      window.removeEventListener('CookiebotOnAccept', onConsentChanged);
      window.removeEventListener('CookiebotOnDecline', onConsentChanged);
    };
  }, [initialized, gb]);

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
