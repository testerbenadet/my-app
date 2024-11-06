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
  const [isGrowthBookInitialized, setIsGrowthBookInitialized] = useState(false);

  useEffect(() => {
    const initializeGrowthBook = () => {
      // Only initialize if consent has been given
      const user_pseudo_id = getGACookie();
      gb.setAttributes({
        user_pseudo_id: user_pseudo_id || 'default_id',
      });

      gb.init({
        streaming: true,
      });

      setIsGrowthBookInitialized(true); // Mark GrowthBook as initialized
    };

    const checkCookiebot = () => {
      if (window.Cookiebot && window.Cookiebot.consents) {
        const consentGiven = window.Cookiebot.consents.analytics;
        setIsConsentGiven(consentGiven);

        if (consentGiven && !isGrowthBookInitialized) {
          initializeGrowthBook();
        }
      }
    };

    // Delay the check by 1 second to allow GTM to load Cookiebot
    setTimeout(checkCookiebot, 1000);

    // Listener for future consent updates
    window.addEventListener("CookieConsentUpdate", checkCookiebot);

    return () => {
      window.removeEventListener("CookieConsentUpdate", checkCookiebot);
    };
  }, [isGrowthBookInitialized]);

  return (
    <GrowthBookProvider growthbook={isGrowthBookInitialized ? gb : null}>
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
