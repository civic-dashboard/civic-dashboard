import { NextConfig } from "next";
const withTM = require("next-transpile-modules")([]);

module.exports = withTM({
  webpack: (
    config: NextConfig,
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    return config;
  },
});

export {};
