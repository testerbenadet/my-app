import React, { useEffect, useState } from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

// Utility function to get _ga cookie value
const getGACookie = () => {
  const gaCookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("_ga="));
  if (gaCookie) {
    const parts = gaCookie.split(".");
    return parts.slice(-2).join(".");
  }
  return null;
};

// GrowthBookWrapper component
const GrowthBookWrapper = ({ children }) => {
  const [gb, setGb] = useState(null);

  useEffect(() => {
    const initGrowthBook = () => {
      const growthbook = new GrowthBook({
        apiHost: "https://cdn.growthbook.io",
        clientKey: "sdk-kBW0vcs9lDPHZcsS", // Replace with your actual client key
        enableDevMode: true,
        trackingCallback: (experiment, result) => {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "experiment_viewed",
            experiment_id: experiment.key,
            variation_id: result.key,
          });
        }
      });

      const user_pseudo_id = getGACookie() || 'default_id';
      growthbook.setAttributes({ user_pseudo_id });

      growthbook.loadFeatures().then(() => {
        setGb(growthbook);
      });
    };

    // Check for CookieControl consent
    if (window.CookieControl && window.CookieControl.Cookie && window.CookieControl.Cookie.consented) {
      initGrowthBook();
    } else {
      // Listen for consent changes in CookieControl
      const consentListener = () => {
        if (window.CookieControl.Cookie.consented) {
          initGrowthBook();
        }
      };
      window.addEventListener('CookieConsentUpdate', consentListener);

      // Clean up listener when component unmounts
      return () => window.removeEventListener('CookieConsentUpdate', consentListener);
    }
  }, []);

  // Render children directly if GrowthBook is not yet initialized
  if (!gb) {
    return <div>Loading...</div>;
  }

  return (
    <GrowthBookProvider growthbook={gb}>
      {children}
    </GrowthBookProvider>
  );
};

export default function App() {
  return (
    <GrowthBookWrapper>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>hello my name is nick</h1>
          <CTAButton />
        </header>
      </div>
    </GrowthBookWrapper>
  );
}

function CTAButton() {
  const isBuyNowEnabled = useFeatureIsOn("buy-now-atc");

  return (
    <button
      className="cta-button"
      onClick={() => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "addToCartClick",
          buttonText: isBuyNowEnabled ? "Buy Now!" : "Add to Cart",
          pagePath: window.location.pathname,
        });
      }}
    >
      {isBuyNowEnabled ? "Buy Now!" : "Add to Cart"}
    </button>
  );
}
