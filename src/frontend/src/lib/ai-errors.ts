import { AiError } from "@/backend";

/** Plain-language message for every backend AI error variant. */
export function describeAiError(error: AiError): string {
  switch (error) {
    case AiError.inferenceUnavailable:
      return "The AI service is unavailable right now. Please try again in a moment.";
    case AiError.emptyInput:
      return "Please enter something first, then try again.";
    case AiError.tooLong:
      return "That input is too long. Try a shorter version.";
    case AiError.notFound:
      return "We could not find what you asked for.";
    case AiError.unauthorized:
      return "You need to sign in to use this feature.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Normalize an unknown thrown value into a readable message. */
export function describeThrown(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
