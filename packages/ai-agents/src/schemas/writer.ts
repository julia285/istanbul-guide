import { z } from "zod";

export const writtenCopySchema = z.object({
  name: z.string().min(1).describe("Clean, publishable event name — not necessarily identical to the source's title."),
  description: z.string().min(40).describe(
    "2-4 original sentences describing the event, written from the supplied facts. Never copy source phrasing.",
  ),
});

export type WrittenCopy = z.infer<typeof writtenCopySchema>;
