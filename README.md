
# Nimbus Navigator 🌦️✨

Nimbus Navigator is a modern web application that provides current weather information for any location and suggests activities based on the prevailing weather conditions. It's built with Next.js, React, Tailwind CSS, ShadCN UI components, and utilizes Genkit for AI-powered activity suggestions.

## Key Features

- **Real-time Weather Data:** Fetches and displays up-to-date weather information including temperature, humidity, wind speed, "feels like" temperature, pressure, visibility, sunrise, and sunset times.
- **Location Search:** Users can search for weather by city name.
- **Geolocation:** Automatically detects the user's current location to provide local weather on page load (if permission is granted).
- **AI-Powered Activity Suggestions:** Leverages Google's Generative AI (via Genkit) to suggest suitable activities based on the current weather and location.
- **Responsive Design:** User interface adapts to different screen sizes for a seamless experience on desktop and mobile devices.
- **Modern UI/UX:** Clean and intuitive interface built with ShadCN UI components and styled with Tailwind CSS.
- **Error Handling & Fallbacks:** Gracefully handles API errors, geolocation failures (defaults to a preset location - Bangalore), and rate limits for AI suggestions.
- **Animated Weather Icons:** Displays visually appealing animated icons corresponding to different weather conditions.

## Tech Stack

- **Frontend:**
    - [Next.js](https://nextjs.org/) (React Framework with App Router)
    - [React](https://reactjs.org/)
    - [TypeScript](https://www.typescriptlang.org/)
- **Styling:**
    - [Tailwind CSS](https://tailwindcss.com/)
    - [ShadCN UI](https://ui.shadcn.com/) (Reusable UI components)
    - [Lucide React](https://lucide.dev/) (Icons)
- **Generative AI:**
    - [Genkit](https://firebase.google.com/docs/genkit) (Orchestration framework for AI flows)
    - [Google Generative AI](https://ai.google.dev/) (For activity suggestions via Gemini models)
- **APIs:**
    - [Open-Meteo API](https://open-meteo.com/) (For weather forecasting and geocoding)
- **Development Tools:**
    - [ESLint](https://eslint.org/) (Linting)
    - [Prettier](https://prettier.io/) (Code formatting - implied, good practice)

## Project Structure

```
/
├── src/
│   ├── app/                # Next.js App Router (pages, layout, globals.css)
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Genkit flow definitions (e.g., suggest-activities.ts)
│   │   ├── dev.ts          # Genkit development server entry point
│   │   └── genkit.ts       # Genkit global AI instance configuration
│   ├── components/         # React components
│   │   ├── ui/             # ShadCN UI components
│   │   └── weather-icons/  # Custom animated weather SVG icons
│   ├── hooks/              # Custom React hooks (e.g., useDebounce, useToast)
│   ├── lib/                # Utility functions and API clients (e.g., weather-api.ts)
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets (though not explicitly used much in this setup)
├── .env                    # Environment variables (GITIGNORED)
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project. This file is used to store API keys and other sensitive information.

    ```env
    # For Google Generative AI (Optional, if you want to use your own key for activity suggestions)
    # GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

    # Note: The Open-Meteo API used in this project is free and does not require an API key.
    ```
    If you have a `GOOGLE_API_KEY` for Genkit, the `src/ai/genkit.ts` file and potentially Genkit's environment setup would use it. The current setup might rely on default or application default credentials if deployed in a Google Cloud environment.

### Running the Application

1.  **Start the Next.js development server:**
    This will run the main web application.
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Start the Genkit development server (for AI flows):**
    This server runs your Genkit flows and allows them to be called by the Next.js application. It usually runs on a different port (often `3400` or `4000`).
    ```bash
    npm run genkit:dev
    ```
    Or, for auto-reloading on changes to AI flow files:
    ```bash
    npm run genkit:watch
    ```

    **Note:** Both servers (Next.js and Genkit) need to be running concurrently for the full application functionality, especially the AI-powered activity suggestions.

## API Usage

-   **Weather Data:** The application uses the [Open-Meteo API](https://open-meteo.com/) for fetching weather forecasts and geocoding location names to coordinates. This API is free for non-commercial use and does not require an API key.
-   **Activity Suggestions:** The AI-driven activity suggestions are powered by Google's Generative AI models (e.g., Gemini) through the [Genkit](https://firebase.google.com/docs/genkit) framework. You might encounter rate limits on the free tier if making too many requests.

## Error Handling and Fallbacks

-   **Geolocation Failure:** If the browser cannot determine the user's location (e.g., permission denied, feature unsupported), the application defaults to showing weather for Bangalore, India.
-   **API Errors:**
    -   If a location cannot be found via the geocoding API, a "Location Not Found" message is displayed.
    -   General network or API errors for weather data will also show an appropriate error message.
-   **AI Suggestion Rate Limits:** If the rate limit for the Google Generative AI API is exceeded, a toast notification will inform the user to try again later.

## Further Development

-   Implement more detailed hourly/daily forecasts.
-   Allow users to save favorite locations.
-   Add more sophisticated AI features (e.g., personalized suggestions based on user preferences).
-   Implement unit and integration tests.
-   Set up CI/CD for automated deployments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

This README provides a good overview of the Nimbus Navigator application.
Let me know if you'd like any sections expanded or modified!
