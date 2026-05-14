import { z } from "zod";

export const prayerSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100),
  details: z.string().min(5, "Please provide more details for your prayer request"),
  isUrgent: z.boolean().optional(),
});

export const feedbackSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(5, "Feedback message is too short"),
});
