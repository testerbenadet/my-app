import React from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

// Utility function to retrieve or set unique_user_id from cookies
function getUniqueUserId() {
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
}

function useGrowthBook() {
  const viewedExperiments = React.useRef(new Set());
  const dataLayerEventsPushed = React.useRef(new Set());
  const [featuresLoaded, setFeaturesLoaded] = React.useState(false);

  const uniqueUserId = getUniqueUserId();

  const hasStatisticsConsent = () => {
    const consentCookie = document.cookie;
    return consentCookie && consentCookie.includes('statistics:true');
  };

  // Initialize GrowthBook with tracking callback before components render
  const gb = React.useMemo(() => {
    const growthbook = new GrowthBook({
      apiHost: 'https://cdn.growthbook.io',
      clientKey: 'sdk-kBW0vcs9lDPHZcsS',
      enableDevMode: true,
      enabled: true,
    });

    growthbook.setTrackingCallback((experiment, result) => {
      if (!viewedExperiments.current.has(experiment.key)) {
        viewedExperiments.current.add(experiment.key);

        if (hasStatisticsConsent() && !dataLayerEventsPushed.current.has(experiment.key)) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'experiment_viewed',
            experiment_id: experiment.key,
            variation_id: result.key,
            anonymous_id: uniqueUserId,
          });
          dataLayerEventsPushed.current.add(experiment.key);
        }
      }
    });

    growthbook.setAttributes({
      anonymous_id: uniqueUserId,
      consent: hasStatisticsConsent(),
    });

    growthbook.loadFeatures().then(() => {
      setFeaturesLoaded(true);
    });

    return growthbook;
  }, []);

  React.useEffect(() => {
    const onConsentChanged = () => {
      if (hasStatisticsConsent() && featuresLoaded) {
        viewedExperiments.current.forEach((experimentKey) => {
          if (!dataLayerEventsPushed.current.has(experimentKey)) {
            const result = gb.getExperimentResult(experimentKey);
            if (result) {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: 'experiment_viewed',
                experiment_id: experimentKey,
                variation_id: result.key,
                anonymous_id: uniqueUserId,
              });
              dataLayerEventsPushed.current.add(experimentKey);
            }
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
  }, [gb, featuresLoaded]);

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
