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

export const componentSchema = defineType({
  name: 'component',
  title: 'Component',
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
      name: 'componentType',
      title: 'Component type',
      type: 'string',
      options: {
        list: [
          'Hero',
          'Navigation',
          'Pricing',
          'Footer',
          'Form',
          'Card',
          'Modal',
          'Other',
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
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
