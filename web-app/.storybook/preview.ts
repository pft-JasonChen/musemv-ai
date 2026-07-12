import type { Preview } from "@storybook/react-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: "dark", value: "#09090B" }
      }
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },

  initialGlobals: {
    backgrounds: {
      value: "dark"
    }
  }
};
export default preview;
