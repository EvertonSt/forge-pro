import { defineType } from 'sanity';
import { descriptionField, slugField, titleField } from './fields.js';

export const categorySchema = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [titleField, slugField, descriptionField],
});
