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

export default function App() {
  const [gb, setGb] = useState(null); // State to store GrowthBook instance

  useEffect(() => {
    const initGrowthBook = () => {
      console.log("Initializing GrowthBook...");
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
        console.log("Features loaded and GrowthBook initialized.");
        setGb(growthbook); // Store initialized GrowthBook instance in state
      });
    };

    // Check if CookieControl is present and consent is already granted
    if (window.CookieControl && window.CookieControl.Cookie && window.CookieControl.Cookie.consented) {
      console.log("Consent already given. Initializing GrowthBook.");
      initGrowthBook();
    } else {
      // Listen for consent updates from CookieControl
      const handleConsentUpdate = () => {
        if (window.CookieControl.Cookie.consented) {
          console.log("Consent granted via CookieControl. Initializing GrowthBook.");
          initGrowthBook();
        }
      };

      window.addEventListener('CookieConsentUpdate', handleConsentUpdate);

      // Clean up event listener on unmount
      return () => window.removeEventListener('CookieConsentUpdate', handleConsentUpdate);
    }
  }, []);

  // Display a loading message until GrowthBook is initialized
  if (!gb) {
    return <div>Loading...</div>;
  }

  return (
    <GrowthBookProvider growthbook={gb}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>hello my name is nick</h1>
          <CTAButton />
        </header>
      </div>
    </GrowthBookProvider>
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
