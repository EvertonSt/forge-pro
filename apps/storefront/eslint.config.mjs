import base from '@forge-pro/config/eslint';
import astro from 'eslint-plugin-astro';

export default [...base, ...astro.configs['flat/recommended']];
