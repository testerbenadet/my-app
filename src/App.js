import React, { useEffect } from "react";
import logo from './logo.svg'; // Importing the logo
import './App.css'; // Importing the CSS file
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from "@growthbook/growthbook-react";

// Utility function to get _ga cookie value
const getGACookie = () => {
  const gaCookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("_ga="));
  if (gaCookie) {
    // _ga cookie format is GA1.2.123456789.987654321
    const parts = gaCookie.split(".");
    return parts.slice(-2).join("."); // Return the last two parts as user_pseudo_id
  }
  return null;
};

// Create a GrowthBook instance
/* global Cookiebot */
let gb;  // Declare gb at a higher scope so it's accessible

function setupGrowthBook() {
  const gbFeaturesCache = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey: "sdk-kBW0vcs9lDPHZcsS",
    enableDevMode: true,
    trackingCallback: (experiment, result) => {  // Inline trackingCallback function
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "experiment_viewed",  // Custom event name for GTM
        experiment_id: experiment.key,
        variation_id: result.key,
      });
    },
  });
  gbFeaturesCache.loadFeatures();
}

function initializeGrowthBook() {
  if (window.CookieConsent && CookieConsent.consent && CookieConsent.consent.statistics()) {
    setupGrowthBook();
  } else {
    console.warn("User has not consented to feature initialization.");
  }
}

// Initialize GrowthBook with optional streaming updates
gb.init({
  streaming: true,
});

export default function App() {
  useEffect(() => {
    // Get the user_pseudo_id from the _ga cookie
    const user_pseudo_id = getGACookie();

    // Set user attributes for targeting, including user_pseudo_id if available
    gb.setAttributes({
      user_pseudo_id: user_pseudo_id || 'default_id', // Use default if _ga not set
    });
  }, []); // Empty dependency array to run once on mount

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
