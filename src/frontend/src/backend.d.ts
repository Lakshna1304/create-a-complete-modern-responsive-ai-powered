import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AccessibilityPreferences {
    textSize: TextSize;
    highContrast: boolean;
}
export type AiResult = {
    __kind__: "ok";
    ok: ImageId;
} | {
    __kind__: "err";
    err: AiError;
};
export type AiResult_1 = {
    __kind__: "ok";
    ok: SummaryResult;
} | {
    __kind__: "err";
    err: AiError;
};
export type AiResult_2 = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: AiError;
};
export type AiResult_3 = {
    __kind__: "ok";
    ok: StepsResult;
} | {
    __kind__: "err";
    err: AiError;
};
export type AiResult_4 = {
    __kind__: "ok";
    ok: ImageDescription;
} | {
    __kind__: "err";
    err: AiError;
};
export type AiResult_5 = {
    __kind__: "ok";
    ok: ChatReply;
} | {
    __kind__: "err";
    err: AiError;
};
export interface Cell {
    value: Value;
    name: string;
}
export interface ChatContextTurn {
    content: string;
    role: ChatRole;
}
export interface ChatMessage {
    id: MessageId;
    content: string;
    createdAt: Timestamp;
    role: ChatRole;
}
export interface ChatReply {
    createdAt: Timestamp;
    reply: string;
}
export interface ChatRequest {
    context: Array<ChatContextTurn>;
    message: string;
}
export interface DescribeImageRequest {
    context?: string;
    imageId: ImageId;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface ImageDescription {
    description: string;
    readableText: string;
}
export type ImageId = bigint;
export type MessageId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface SimplifyRequest {
    text: string;
}
export interface StepsRequest {
    task: string;
}
export interface StepsResult {
    steps: Array<string>;
}
export interface SummarizeRequest {
    text: string;
}
export interface SummaryResult {
    keyPoints: Array<string>;
}
export type Timestamp = bigint;
export interface UserSettings {
    selectedModule?: AssistanceModule;
    preferences: AccessibilityPreferences;
    updatedAt: Timestamp;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AiError {
    inferenceUnavailable = "inferenceUnavailable",
    emptyInput = "emptyInput",
    tooLong = "tooLong",
    notFound = "notFound",
    unauthorized = "unauthorized"
}
export enum AssistanceModule {
    deafAndMute = "deafAndMute",
    visuallyImpaired = "visuallyImpaired",
    mobility = "mobility",
    cognitive = "cognitive"
}
export enum ChatRole {
    user = "user",
    assistant = "assistant"
}
export enum TextSize {
    large = "large",
    small = "small",
    extraLarge = "extraLarge",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Shared assistant chat: takes a message plus optional context, returns a
     * / plain-language reply, and persists both turns for the caller.
     */
    chat(request: ChatRequest): Promise<AiResult_5>;
    /**
     * / Remove all saved conversation history for the caller.
     */
    clearChatHistory(): Promise<void>;
    /**
     * / Describe an uploaded image: notable objects and readable text.
     * /
     * / The platform inference client serves text models only, so the description
     * / is produced from the filename and the caller-supplied `context` text.
     * / Without context the endpoint returns `#emptyInput` instead of inventing a
     * / description.
     */
    describeImage(request: DescribeImageRequest): Promise<AiResult_4>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Turn a task description into ordered steps.
     */
    generateSteps(request: StepsRequest): Promise<AiResult_3>;
    /**
     * / Static Markdown documentation of the ACCESSAI backend API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Return the caller's saved conversation history, oldest first.
     */
    getChatHistory(): Promise<Array<ChatMessage>>;
    /**
     * / Return the caller's persisted settings (module + accessibility prefs).
     */
    getMySettings(): Promise<UserSettings>;
    isCallerAdmin(): Promise<boolean>;
    schema(): Promise<string>;
    /**
     * / Persist the caller's accessibility preferences.
     */
    setAccessibilityPreferences(preferences: AccessibilityPreferences): Promise<UserSettings>;
    /**
     * / Persist the caller's selected assistance module.
     */
    setSelectedModule(module: AssistanceModule): Promise<UserSettings>;
    /**
     * / Simplify complex text into easy-to-understand language.
     */
    simplifyText(request: SimplifyRequest): Promise<AiResult_2>;
    /**
     * / Summarize text into key points.
     */
    summarizeText(request: SummarizeRequest): Promise<AiResult_1>;
    /**
     * / Store an uploaded image and return its reference id.
     * /
     * / The bytes live in object storage; the canister keeps only the reference
     * / plus the filename, keyed to the caller.
     */
    uploadImage(filename: string, blob: ExternalBlob): Promise<AiResult>;
}
