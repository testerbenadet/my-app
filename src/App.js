import React from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

function useGrowthBook() {
  const [gb, setGb] = React.useState(() => new GrowthBook());
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const COOKIE_NAME = 'unique_user_id';

    const setPersistentRandomizedCookie = () => {
      let cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAME}=`));

      if (!cookieValue) {
        // Create a unique identifier if the cookie does not exist
        const randomId = `id_${Math.random().toString(36).substring(2, 15)}`;
        document.cookie = `${COOKIE_NAME}=${randomId}; path=/; max-age=31536000`; // 1-year expiration
        return randomId;
      } else {
        return cookieValue.split('=')[1]; // Extract the actual value of the cookie
      }
    };

    const uniqueUserId = setPersistentRandomizedCookie(); // Get or set the persistent cookie

    const initGrowthBook = () => {
      const growthbook = new GrowthBook({
        apiHost: 'https://cdn.growthbook.io',
        clientKey: 'sdk-kBW0vcs9lDPHZcsS',
        enableDevMode: true,
        enabled: true,
      });

      // Setting attributes for GrowthBook, including the unique user ID as "UU"
      growthbook.setAttributes({
        loggedIn: false,       // example attribute
        deviceId: 'web',       // example attribute
        UU: uniqueUserId,      // Set "UU" attribute to the unique_user_id cookie value
      });

      growthbook.loadFeatures().then(() => {
        setGb(growthbook);
        setInitialized(true);
      });
    };

    if (!initialized) {
      initGrowthBook();
    }

  }, [initialized]);

  return gb;
}

export default function App() {
  const gb = useGrowthBook();

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

  if (!isReadMoreEnabled) return null;

  return (
    <button className="read-more-button" onClick={handleReadMoreClick}>
      Read More
    </button>
  );
}
