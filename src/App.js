import React, { useEffect, useState } from "react";
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

// Create a GrowthBook instance but don't initialize it immediately
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-kBW0vcs9lDPHZcsS", // Replace with your actual client key
  enableDevMode: true,
  // Tracking callback to log experiment results
  trackingCallback: (experiment, result) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "experiment_viewed",  // Custom event name for GTM
      experiment_id: experiment.key,
      variation_id: result.key,
    });
  },
});

export default function App() {
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    // Check if consent for analytics has already been given on load
    const checkConsent = () => {
      const consentGiven = Cookiebot && Cookiebot.consents && Cookiebot.consents.analytics;
      setIsConsentGiven(consentGiven);
    };

    // Event listener for consent updates from Cookiebot
    window.addEventListener("CookieConsentUpdate", checkConsent);

    // Check consent on mount
    checkConsent();

    return () => {
      window.removeEventListener("CookieConsentUpdate", checkConsent);
    };
  }, []);

  useEffect(() => {
    if (isConsentGiven) {
      // Only initialize GrowthBook when consent is given
      const user_pseudo_id = getGACookie();

      // Set user attributes for targeting, including user_pseudo_id if available
      gb.setAttributes({
        user_pseudo_id: user_pseudo_id || 'default_id', // Use default if _ga not set
      });

      // Initialize GrowthBook after consent
      gb.init({
        streaming: true,
      });
    }
  }, [isConsentGiven]); // Re-run if consent status changes

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
