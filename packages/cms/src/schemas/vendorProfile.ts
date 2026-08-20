import { defineField, defineType } from 'sanity';
import { descriptionField, slugField, titleField } from './fields.js';

export const vendorProfileSchema = defineType({
  name: 'vendorProfile',
  title: 'Vendor profile',
  type: 'document',
  fields: [
    titleField,
    slugField,
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url',
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
    },
    defineField({
      name: 'portfolio',
      title: 'Portfolio',
      type: 'array',
      of: [
        { type: 'reference', to: [{ type: 'template' }, { type: 'component' }] },
      ],
    }),
    descriptionField,
  ],
});
