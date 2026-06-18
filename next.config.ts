import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of Node-native server packages (dockerode uses ssh2/crypto)
  serverExternalPackages: ['dockerode', 'docker-modem', 'ssh2', '@kubernetes/client-node'],
  devIndicators: false,
};

export default nextConfig;
