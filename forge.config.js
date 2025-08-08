/**
 * forge.config.js
 *
 * Main configuration file for Electron Forge.
 * Defines how the app is built, packaged, and launched across environments.
 *
 * Key Features:
 * - Uses @electron-forge/plugin-vite for Vite-powered builds (main, preload, renderer)
 * - Enables runtime hardening using Electron Fuses
 * - Outputs `.deb` packages for Linux by default
 *
 * Notes:
 * - `asar: true` bundles source code in an archive (required for Fuse security options)
 * - Adds native `keytar` module as extraResource for runtime availability
 *
 * @see https://www.electronforge.io/config — Forge configuration reference
 * @see https://github.com/electron/forge — Plugin and packaging documentation
 */
const {FusesPlugin} = require('@electron-forge/plugin-fuses');
const {FuseV1Options, FuseVersion} = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'node_modules/keytar'
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.ts',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // FusePlugin disables unsafe or unnecessary Electron features
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
