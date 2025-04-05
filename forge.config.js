const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: [
        //"**/recursos/database.sqlite",
      ]
    },
    extraResource: [
      './LICENSE',
      './NOTICE'
    ],
    // Configurar ícone para o packager (sem extensão)
    icon: path.join(__dirname, 'recursos', 'icon')
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // Configuração para Windows
        name: 'TemplatesApp',
        setupIcon: path.join(__dirname, 'recursos', 'icon.ico'),
        iconUrl: path.join(__dirname, 'recursos', 'icon.ico'),
        shortcutName: 'Templates App',
        createDesktopShortcut: true,
        //loadingGif: path.join(__dirname, 'recursos', 'installer.gif'), // Opcional: GIF durante a instalação
      },
    },
    {
      name: '@electron-forge/maker-zip',
      // Usa o ícone do packager
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        // Configuração para Linux (Debian)
        options: {
          icon: path.join(__dirname, 'recursos', 'icon.png'),
          categories: ['Office', 'Utility'],
          maintainer: 'Alfredo Rolim Pereira',
          homepage: 'https://github.com/Amolpploma/templates'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        // Configuração para Linux (RPM)
        options: {
          icon: path.join(__dirname, 'recursos', 'icon.png'),
          categories: ['Office', 'Utility'],
          maintainer: 'Alfredo Rolim Pereira',
          homepage: 'https://github.com/Amolpploma/templates'
        }
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
