import React, { useEffect } from "react";
import logo from './logo.svg'; // Importing the logo
import './App.css'; // Importing the CSS file
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import OtherComponent from './OtherComponent'; // Make sure to import any other components you use

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
          <h1>hello my name is olle</h1>
        </header>
        <OtherComponent />
      </div>
    </GrowthBookProvider>
  );
}
