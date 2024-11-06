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

// Initialize GrowthBook with optional streaming updates
gb.init({
  streaming: true,
});


export default function App() {
  const [hasConsent, setHasConsent] = useState(false);
  const [isGrowthBookInitialized, setIsGrowthBookInitialized] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      if (window.CookieControl && window.CookieControl.Cookie) {
        setHasConsent(window.CookieControl.Cookie.consented === true);
      }
    };

    checkConsent(); // Initial consent check on mount

    // Poll for consent status every 500 ms until consent is granted
    const intervalId = setInterval(checkConsent, 500);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (hasConsent && !isGrowthBookInitialized) {
      // Initialize GrowthBook once consent is granted
      const gaCookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("_ga="));
      const user_pseudo_id = gaCookie ? gaCookie.split(".").slice(-2).join(".") : 'default_id';

      gb.setAttributes({ user_pseudo_id });
      gb.init({ streaming: true });

      setIsGrowthBookInitialized(true);
    }
  }, [hasConsent, isGrowthBookInitialized]);

  if (!isGrowthBookInitialized) {
    return <div>Loading...</div>;
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
