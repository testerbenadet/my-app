import React, { useEffect, useState } from 'react';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from '@growthbook/growthbook-react';
import logo from './logo.svg';
import './App.css';

// ... (other functions remain the same)

export default function App() {
  const [gb, setGb] = useState(new GrowthBook()); // Initialize with default GrowthBook instance

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
        setGb(growthbook); // Update the GrowthBook instance
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

  // Remove the conditional rendering
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
