import React, { useEffect } from "react";
import logo from './logo.svg'; // Importing the logo
import './App.css'; // Importing the CSS file
import { GrowthBook, GrowthBookProvider, IfFeatureEnabled, FeatureString } from "@growthbook/growthbook-react"

// Create a GrowthBook instance
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-kBW0vcs9lDPHZcsS", // Replace with your actual client key
  enableDevMode: true,
  // Tracking callback to log experiment results
  trackingCallback: (experiment, result) => {
    console.log("Experiment Viewed", {
      experimentId: experiment.key,
      variationId: result.key,
    });
  },
});

// Initialize GrowthBook with optional streaming updates
gb.init({
  streaming: true,
});

export default function App() {
  useEffect(() => {
    // Assuming you have access to a user object
    const user = {
      id: 'user123', // Replace with actual user ID
      company: 'MyCompany', // Replace with actual company name
    };

    // Set user attributes for targeting
    gb.setAttributes({
      id: user.id,
      company: user.company,
    });
  }, []); // Empty dependency array to run once on mount

  return (
    <GrowthBookProvider growthbook={gb}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>hello my name is nick</h1>
          <IfFeatureEnabled feature="buy-now-atc"> {/* Conditionally render button or additional behavior */}
            <button
              className="cta-button buy-now" // Optionally add a new class if needed for styling
              onClick={() => {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                  event: "buyNowClick", // Different event if feature is enabled
                  buttonText: "Buy Now!",
                  pagePath: window.location.pathname,
                });
              }}
            >
              <FeatureString feature="buy-now-atc" default="Add to Cart" /> {/* Handle text change */}
            </button>
          </IfFeatureEnabled>
          <IfFeatureEnabled feature="buy-now-atc" fallback={<button
            className="cta-button"
            onClick={() => {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: "addToCartClick",
                buttonText: "Add to Cart",
                pagePath: window.location.pathname,
              });
            }}
          >
            Add to Cart
          </button>}/>
        </header>
      </div>
    </GrowthBookProvider>
  );
}
