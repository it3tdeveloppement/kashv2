import type { Config } from "tailwindcss";
import baseConfig from "@kash/config/tailwind";
const config: Config = { ...baseConfig, content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"] };
export default config;
