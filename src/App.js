import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';
import { GrowthBook, GrowthBookProvider, useFeatureIsOn } from "@growthbook/growthbook-react";

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

// Create a GrowthBook instance but don't initialize it immediately
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-kBW0vcs9lDPHZcsS",
  enableDevMode: true,
  trackingCallback: (experiment, result) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "experiment_viewed",
      experiment_id: experiment.key,
      variation_id: result.key,
    });
  },
});

export default function App() {
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    const checkCookiebotConsent = () => {
      // Check if Cookiebot exists and if analytics consent is given
      if (window.Cookiebot && window.Cookiebot.consents) {
        const consentGiven = window.Cookiebot.consents.analytics;
        setIsConsentGiven(consentGiven);
        return true;
      }
      return false;
    };

    // Polling function to check for Cookiebot availability
    const intervalId = setInterval(() => {
      if (checkCookiebotConsent()) {
        clearInterval(intervalId); // Stop polling once consent is confirmed
      }
    }, 500); // Check every 500ms

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isConsentGiven) {
      const user_pseudo_id = getGACookie();
      gb.setAttributes({
        user_pseudo_id: user_pseudo_id || 'default_id',
      });

      gb.init({
        streaming: true,
      });
    }
  }, [isConsentGiven]);

  return (
    <GrowthBookProvider growthbook={isConsentGiven ? gb : null}>
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
