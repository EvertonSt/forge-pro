import { categorySchema } from './category.js';
import { componentSchema } from './component.js';
import { templateSchema } from './template.js';
import { vendorProfileSchema } from './vendorProfile.js';

export { categorySchema } from './category.js';
export { componentSchema } from './component.js';
export { templateSchema } from './template.js';
export { vendorProfileSchema } from './vendorProfile.js';

/** Full schema array — hand this to Sanity Studio's defineConfig. */
export const schemas = [categorySchema, vendorProfileSchema, templateSchema, componentSchema];
