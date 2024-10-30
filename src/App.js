import React, { useEffect } from "react";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import OtherComponent from './OtherComponent'; // Make sure to import any other components you use

// Create a GrowthBook instance
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-abc123", // Replace with your actual client key
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
      <OtherComponent />
    </GrowthBookProvider>
  );
}
