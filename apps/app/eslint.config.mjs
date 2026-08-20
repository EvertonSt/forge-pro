// NOTE: eslint-config-next is intentionally not wired in yet — its bundled
// eslint-plugin-react (7.37.x) crashes against ESLint 10's context API
// ("contextOrFilename.getFilename is not a function"). Re-add it once the
// Next.js ESLint integration supports ESLint 10. The shared base config
// covers the app's code in the meantime.
import base from '@forge-pro/config/eslint';

export default [...base];
