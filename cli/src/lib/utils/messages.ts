import {underline, cyan, bold, yellow, green} from 'colors';
type Messages = {
    promptInstallJdk: string;
    promptJdkPath: string;
    messageDownloadJdk: string;
    messageDownloadJdkSrc: string;
    messageDecompressJdkSrc: string;
    messageDownloadJdkBin: string;
    messageDecompressJdkBin: string;


    promptInstallSdk: string;
    promptSdkPath: string;
    messageDownloadSdk: string;
    errorSdkTerms: string;
    promptSdkTerms: string;
    messageDownloadAndroidSdk: string;
    messageDecompressAndroidSdk: string;

    messageInstallingBuildTools: string;
    messageInvalidIcon: (iconPath: string) => string;
    errorStartUrlNotReachable: (launchUrl: string) => string;

    messageGeneratingAndroidProject: string;

    messageCheckSuccess: (url: string, redirectLocation?: string) => string;

    messageInitializingWebManifest: (manifestUrl: string) => string;
    messageInitializingLocalManifest: (manifestUrl: string) => string;
    errorMissingManifestParameter: string;
    warnFamilyPolicy: string;
    promptIconUrl: string;
    errorInvalidUrl: (url: string) => string;
    errorUrlMustBeImage: (mimeType: string) => string;
    promptVersionCode: string;
    promptVersionName: string;
    messageSigningKeyInformation: string;
    // messageSigningKeyInformationDesc: string;
    // promptKeyAlias: string;
    messageProjectGeneratedSuccess: string;

    messageSigningKeyCreation: string;
    messageSigningKeyNotFound: (path: string) => string;
    promptCreateKey: string;
    promptKeyFullName: string;
    promptKeyOrganizationalUnit: string;
    promptKeyOrganization: string;
    promptKeyCountry: string;
    promptKeystorePassword: string;
    promptKeyPassword: string;

    messageBuildingApp: string;

    messageEnterPasswords: (keypath: string, keyalias: string) => string;
    errorMinLength: (minLength: number, actualLength: number) => string;
    errorMaxLength: (maxLength: number, actualLength: number) => string;

    errorInvalidInteger: (integer: string) => string;
    messageApkSuccess: (filename: string) => string;
    missingUrlToCheck: string;
}

export const messages: Messages = {
  promptInstallJdk: `Do you want picoxr-web to install the JDK (recommended)?
  (Enter "No" to use your own JDK 11 installation)`,
  promptJdkPath: 'Path to your existing JDK 11:',
  messageDownloadJdk: 'Downloading JDK 11 to ',
  messageDownloadJdkSrc: 'Downloading the JDK 11 Sources...',
  messageDecompressJdkSrc: 'Decompressing the JDK 11 Sources...',
  messageDownloadJdkBin: 'Downloading the JDK 11 Binaries...',
  messageDecompressJdkBin: 'Decompressing the JDK 11 Binaries...',

  promptInstallSdk: `Do you want picoxr-web to install the Android SDK (recommended)?
  (Enter "No" to use your own Android SDK installation)`,
  promptSdkPath: 'Path to your existing Android SDK:',
  messageDownloadSdk: 'Downloading Android SDK to ',
  errorSdkTerms: 'Downloading Android SDK failed because Terms and Conditions was not signed.',
  promptSdkTerms: `Do you agree to the Android SDK terms and conditions at ${underline('https://developer.android.com/studio/terms.html')}?`,
  messageDownloadAndroidSdk: 'Downloading the Android SDK...',
  messageDecompressAndroidSdk: 'Decompressing the Android SDK...',

  messageInstallingBuildTools: 'Installing Android Build Tools. Please, read and accept the ' +
      'license agreement.',

  messageGeneratingAndroidProject: 'Generating Android Project.',
  // 可安装检测成功输出
  messageCheckSuccess: (url: string, redirectLocation?: string): string => {
    return ` URL ${cyan(url)} ${redirectLocation? `redirected to ${cyan(redirectLocation)}`:''} validation successful.Here is the relevant information:`;
  },
  errorMissingManifestParameter: 'Missing required parameter '+
  `${cyan('--manifest-url')} or ${cyan('--manifest')}`,
  messageInitializingWebManifest: (manifestUrl: string): string => {
    return `Initializing application from Web Manifest:\n\t-  ${cyan(manifestUrl)}`;
  },
  messageInitializingLocalManifest: (manifestPath: string): string => {
    return `Initializing application from Local Manifest:\n\t-  ${cyan(manifestPath)}`;
  },
  messageInvalidIcon: (iconPath: string): string => {
    return `Invalid icon path: ${cyan(iconPath)}`;
  },
  errorStartUrlNotReachable: (launchUrl: string): string =>
    `URL ${launchUrl} can not be accessible.`+
    'Please check your internet connection or start_url in manifest file.',
  warnFamilyPolicy:
      bold(yellow('WARNING: ')) + 'Trusted Web Activities are currently incompatible' +
      ' with applications\ntargeting children under the age of 13.' +
      ' Check out the Play for' +
      ' Families\npolicies to learn more.\n' +
      cyan('https://play.google.com/console/about/families/'),
  // 本地manifest,交互式提供icon
  promptIconUrl: 'Icon URL:',
  errorInvalidUrl: (url: string): string => {
    return `Invalid URL: ${url}`;
  },
  errorUrlMustBeImage: (mimeType: string): string => {
    return `URL must resolve to an image/* mime-type, but resolved to ${mimeType}.`;
  },
  promptVersionCode: 'Starting version code for the new app version:',
  promptVersionName: 'Starting version name for the new app version:',
  messageSigningKeyInformation: underline(`\nSigning key information ${green('(5/5)')}`),
  //   messageSigningKeyInformationDesc: `
  // Please, enter information about the key store containing the keys that will be used
  // to sign the application. If a key store does not exist on the provided path,
  // picoxr-web will prompt for the creation of a new keystore.

  // \t- ${bold('Key store location:')} The location of the key store in the file
  // \t  system.

  // \t- ${bold('Key name:')} The alias used on the key.

  // Read more about Android signing keys at:
  // \t ${cyan('https://developer.android.com/studio/publish/app-signing')}\n`,
  // promptKeyAlias: 'Key name:',
  messageProjectGeneratedSuccess: '\nProject generated successfully.',
  // 创建keystore
  messageSigningKeyCreation: underline('\nSigning key creation'),
  messageSigningKeyNotFound: (path: string): string => {
    return `\nAn existing key store could not be found at "${path}".\n`;
  },
  promptCreateKey: 'Do you want to create one now?',
  promptKeyFullName: 'First and Last names (eg: PICO):',
  promptKeyOrganizationalUnit: 'Organizational Unit (eg: PICO Dept):',
  promptKeyOrganization: 'Organization (eg: Company Name):',
  promptKeyCountry: 'Country (2 letter code):',
  promptKeystorePassword: 'Password for the Key Store:',
  promptKeyPassword: 'Password for the Key:',
  messageBuildingApp: '\nBuilding the Android App...',
  messageEnterPasswords: (keypath: string, keyalias: string): string => {
    return `Please, enter passwords for the keystore ${cyan(keypath)} and alias \
${cyan(keyalias)}.\n`;
  },
  // build时，校验输入的keystore和key的密码长度
  errorMinLength: (minLength, actualLength): string => {
    return `Minimum length is ${minLength} but input is ${actualLength}.`;
  },
  errorMaxLength: (maxLength, actualLength): string => {
    return `Maximum length is ${maxLength} but input is ${actualLength}.`;
  },
  errorInvalidInteger: (integer: string): string => {
    return `Invalid integer provided: ${integer}`;
  },
  messageApkSuccess: (filename: string): string => {
    return `\t- Generated Android APK at ${cyan(filename)}`;
  },
  // 可安装检测url参数缺失
  missingUrlToCheck: 'Missing required parameter '+`${cyan('--url')}`,
};
