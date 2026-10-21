mixin () {
  /// Static Markdown documentation of the ACCESSAI backend API.
  public query func getApiDoc() : async Text {
    "# ACCESSAI Backend API\n\n" #
    "## Purpose\n\n" #
    "The ACCESSAI canister backs an accessibility assistant. It exposes a shared\n" #
    "AI assistant plus four module-specific capabilities (text simplification,\n" #
    "summarization, step-by-step instructions, and image description), and it\n" #
    "persists each user's selected assistance module, accessibility preferences,\n" #
    "and conversation history.\n\n" #
    "## Authentication and authorization\n\n" #
    "Every AI endpoint and every persisted record is keyed to the caller's\n" #
    "principal. `chat`, `simplifyText`, `summarizeText`, `generateSteps`,\n" #
    "`uploadImage`, `describeImage`, `clearChatHistory`, `setSelectedModule` and\n" #
    "`setAccessibilityPreferences` require a signed (non-anonymous) caller and\n" #
    "trap with `Sign in to use the assistant` or `Sign in to save your settings`\n" #
    "otherwise. `getChatHistory` and `getMySettings` are queries and return the\n" #
    "caller's own data; an anonymous caller sees empty defaults.\n\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin`. An agent already holding the user's\n" #
    "Internet Identity authorization derives the correct per-app principal\n" #
    "against that origin (for example `icp identity link web <name> --app <host>`).\n" #
    "Such a delegation acts with the user's full authority in this app until it\n" #
    "expires.\n\n" #
    "Registration is a prerequisite for role-guarded calls. A direct API caller\n" #
    "must call `_initialize_access_control` once as a signed-in caller before any\n" #
    "role-guarded call, guarded queries included. The first caller to initialize\n" #
    "receives the `#admin` role; every later caller receives `#user`. An\n" #
    "unregistered caller receives the trap `User is not registered` from\n" #
    "`getUserRole`, and an anonymous caller is treated as `#guest`. A caller can\n" #
    "be unregistered while assuming the app already knows it, because\n" #
    "registration happens only when a caller signs in through the app's own\n" #
    "frontend; a principal that never did so is unregistered even when it belongs\n" #
    "to the app's owner, and a signed-in caller derived against a different origin\n" #
    "is a different principal than the one the frontend registered.\n\n" #
    "## Methods\n\n" #
    "- `chat(request : ChatRequest) : AiResult<ChatReply>` — send a message plus\n" #
    "  optional prior turns; returns a plain-language reply and persists both the\n" #
    "  user turn and the assistant turn.\n" #
    "- `simplifyText(request : SimplifyRequest) : AiResult<Text>` — rewrite text\n" #
    "  in easy language.\n" #
    "- `summarizeText(request : SummarizeRequest) : AiResult<SummaryResult>` —\n" #
    "  return key points, one per array element.\n" #
    "- `generateSteps(request : StepsRequest) : AiResult<StepsResult>` — return\n" #
    "  ordered steps, one per array element.\n" #
    "- `uploadImage(filename : Text, blob : ExternalBlob) : AiResult<ImageId>` —\n" #
    "  store an uploaded image and return its reference id.\n" #
    "- `describeImage(request : DescribeImageRequest) : AiResult<ImageDescription>`\n" #
    "  — describe a stored image from its filename and the caller-supplied\n" #
    "  `context` text.\n" #
    "- `getChatHistory() : [ChatMessage]` — the caller's saved turns, oldest first.\n" #
    "- `clearChatHistory() : ()` — delete all of the caller's saved turns.\n" #
    "- `getMySettings() : UserSettings` — the caller's module and preferences.\n" #
    "- `setSelectedModule(module_) : UserSettings` — persist the chosen module.\n" #
    "- `setAccessibilityPreferences(preferences) : UserSettings` — persist high\n" #
    "  contrast and text size.\n" #
    "- `schema() : Text` and `execute(qJson : Text)` — the OQL query surface. Both\n" #
    "  are queries; `schema` returns a JSON schema document and `execute` runs a\n" #
    "  JSON query. Entities are authorized per table: `userSettings` and `image`\n" #
    "  are `controllerOrScoped`, so a controller reads every row and a signed-in\n" #
    "  caller reads only its own.\n" #
    "- `_immutableObjectStorageCreateCertificate(blobHash : Text)` — platform\n" #
    "  object-storage certificate endpoint; not called by app clients directly.\n\n" #
    "## Units and encoding\n\n" #
    "`Timestamp` is nanoseconds from `Time.now()`, a signed `Int`. `MessageId` and\n" #
    "`ImageId` are `Nat`. `ExternalBlob` is a `Blob` reference to object storage;\n" #
    "the bytes live off-chain and the canister keeps only the reference.\n" #
    "`AiResult<T>` is `{ #ok : T }` or `{ #err : AiError }`. `AiError` is one of\n" #
    "`#inferenceUnavailable`, `#emptyInput`, `#tooLong`, `#notFound`,\n" #
    "`#unauthorized`.\n\n" #
    "## Lifecycle and polling\n\n" #
    "Each AI call is one update call that performs one HTTP outcall, so it takes\n" #
    "seconds rather than milliseconds. There is no job id and nothing to poll:\n" #
    "await the call and render the result. A `#err(#inferenceUnavailable)` means\n" #
    "the model call failed and the same request may be retried.\n\n" #
    "## Mutation retry safety\n\n" #
    "`chat` is not idempotent: each successful call appends two new turns. A\n" #
    "retry after a timeout can therefore duplicate a turn. `uploadImage` is not\n" #
    "idempotent either — each call allocates a new `ImageId`. `setSelectedModule`\n" #
    "and `setAccessibilityPreferences` are idempotent: repeating them with the\n" #
    "same value leaves the same stored settings. `clearChatHistory` is\n" #
    "destructive and idempotent.\n\n" #
    "## Errors and gotchas\n\n" #
    "- `#emptyInput` is returned for blank text, and for `describeImage` when no\n" #
    "  `context` text is supplied.\n" #
    "- `#tooLong` is returned when input exceeds 8000 characters.\n" #
    "- `#notFound` is returned by `describeImage` for an unknown image id.\n" #
    "- `#unauthorized` is returned by `describeImage` when the image belongs to\n" #
    "  another caller.\n" #
    "- The platform inference client serves text models only. `describeImage`\n" #
    "  never inspects pixels: it describes the image from the filename and the\n" #
    "  caller-supplied `context` text. Supply `context` (a caption, or text\n" #
    "  extracted on the client) for a useful description.\n" #
    "- Conversation history is capped at 200 turns per user; older turns are\n" #
    "  dropped.\n";
  };
};
