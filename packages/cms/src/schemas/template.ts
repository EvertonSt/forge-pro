import { defineField, defineType } from 'sanity';
import {
  descriptionField,
  frameworkField,
  previewUrlField,
  priceField,
  qaBadgeField,
  slugField,
  stackField,
  titleField,
} from './fields.js';

export const templateSchema = defineType({
  name: 'template',
  title: 'Template',
  type: 'document',
  fields: [
    titleField,
    slugField,
    descriptionField,
    priceField,
    previewUrlField,
    frameworkField,
    stackField,
    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      of: [{ type: 'image' }],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'versions',
      title: 'Versions / changelog',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'version', title: 'Version', type: 'string' }),
            defineField({ name: 'notes', title: 'Notes', type: 'text', rows: 3 }),
            defineField({ name: 'releasedAt', title: 'Released', type: 'datetime' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'vendor',
      title: 'Vendor',
      type: 'reference',
      to: [{ type: 'vendorProfile' }],
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    qaBadgeField,
  ],
});
