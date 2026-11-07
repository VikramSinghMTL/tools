import { createApp } from "vue";
// Bundled rather than loaded from Google Fonts, so the app works offline and makes no third-party requests.
import "@fontsource-variable/source-serif-4/opsz.css";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");
