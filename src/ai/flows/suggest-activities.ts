// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Provides activity suggestions based on weather conditions and location.
 *
 * - suggestActivities - A function that suggests activities based on weather and location.
 * - SuggestActivitiesInput - The input type for the suggestActivities function.
 * - SuggestActivitiesOutput - The return type for the suggestActivities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActivitiesInputSchema = z.object({
  weatherCondition: z
    .string()
    .describe('The current weather condition (e.g., sunny, rainy, cloudy).'),
  location: z.string().describe('The user\u2019s location (e.g., city, state).'),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const SuggestActivitiesOutputSchema = z.object({
  activities: z
    .array(z.string())
    .describe(
      'A list of suggested activities based on the weather condition and location.'
    ),
});
export type SuggestActivitiesOutput = z.infer<typeof SuggestActivitiesOutputSchema>;

export async function suggestActivities(input: SuggestActivitiesInput): Promise<SuggestActivitiesOutput> {
  return suggestActivitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivitiesPrompt',
  input: {schema: SuggestActivitiesInputSchema},
  output: {schema: SuggestActivitiesOutputSchema},
  prompt: `You are a helpful assistant that suggests activities based on the weather condition and location.

  Weather Condition: {{{weatherCondition}}}
  Location: {{{location}}}

  Suggest a list of activities that are appropriate for the given weather condition and location.
  Format the activities as a numbered list.
`,
});

const suggestActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestActivitiesFlow',
    inputSchema: SuggestActivitiesInputSchema,
    outputSchema: SuggestActivitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
