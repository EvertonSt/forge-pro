import { defineField } from 'sanity';

export const titleField = defineField({
  name: 'title',
  title: 'Title',
  type: 'string',
  validation: (r) => r.required(),
});

export const slugField = defineField({
  name: 'slug',
  title: 'Slug',
  type: 'slug',
  options: { source: 'title', maxLength: 96 },
  validation: (r) => r.required(),
});

export const descriptionField = defineField({
  name: 'description',
  title: 'Description',
  type: 'text',
  rows: 4,
});

export const priceField = defineField({
  name: 'price',
  title: 'Price',
  type: 'object',
  fields: [
    defineField({
      name: 'amount',
      title: 'Amount (cents)',
      type: 'number',
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'USD',
    }),
  ],
});

export const previewUrlField = defineField({
  name: 'previewUrl',
  title: 'Live preview URL',
  description: 'URL the QA gate and buyers use to preview this item.',
  type: 'url',
});

export const frameworkField = defineField({
  name: 'framework',
  title: 'Framework',
  type: 'string',
  options: {
    list: ['Astro', 'Next.js', 'React', 'Vue', 'Svelte', 'Plain HTML', 'Other'],
  },
});

export const stackField = defineField({
  name: 'stack',
  title: 'Stack',
  type: 'array',
  of: [{ type: 'string' }],
  options: { layout: 'tags' },
});

/**
 * QA badge — written by the Forge Pro QA gate, never by hand. Mirrors the
 * public QaBadge type in @forge-pro/shared-types.
 */
export const qaBadgeField = defineField({
  name: 'qaBadge',
  title: 'QA badge (patched by the QA gate)',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Verified', value: 'verified' },
          { title: 'Rejected', value: 'rejected' },
          { title: 'Not applicable', value: 'not_applicable' },
        ],
      },
    }),
    defineField({
      name: 'compositeScore',
      title: 'Composite score',
      type: 'number',
    }),
    defineField({
      name: 'scores',
      title: 'Category scores',
      type: 'object',
      fields: [
        defineField({ name: 'performance', title: 'Performance', type: 'number' }),
        defineField({ name: 'seo', title: 'SEO', type: 'number' }),
        defineField({ name: 'accessibility', title: 'Accessibility', type: 'number' }),
        defineField({ name: 'bestPractices', title: 'Best practices', type: 'number' }),
      ],
    }),
    defineField({ name: 'lastRunAt', title: 'Last run', type: 'datetime' }),
    defineField({ name: 'reportUrl', title: 'Report URL', type: 'url' }),
  ],
});
