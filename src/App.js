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

// Function to parse CookieConsent and check for statistics consent
const hasStatisticsConsent = () => {
  const consentCookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("CookieConsent="));
console.log(consentCookie)
  if (consentCookie) {
    const cookieValue = consentCookie.split("=")[1];
console.log('abbas')
    // Manually parse the cookie string to check if statistics is true
    const consentParts = cookieValue.split(',');
    const consentObject = {};

    consentParts.forEach(part => {
      const [key, value] = part.split(':');
      const cleanKey = key.replace(/[{}'"]/g, '').trim();
      const cleanValue = value.replace(/[{}'"]/g, '').trim();
console.log(key, value)
      console.log(cleanKey, cleanValue)
      // Convert "true" and "false" to boolean values
      consentObject[cleanKey] = cleanValue === 'true' ? true : cleanValue === 'false' ? false : cleanValue;
    });

    return consentObject.statistics === true;
  }
  return false;
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

    // Check for statistics consent
    if (hasStatisticsConsent()) {
      console.log("Statistics consent given. Initializing GrowthBook.");
      initGrowthBook();
    } else {
      // Poll for consent status every 500 ms until consent is granted
      const intervalId = setInterval(() => {
        if (hasStatisticsConsent()) {
          console.log("Statistics consent now given. Initializing GrowthBook.");
          initGrowthBook();
          clearInterval(intervalId); // Stop polling after initializing
        }
      }, 500);
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, []);

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
