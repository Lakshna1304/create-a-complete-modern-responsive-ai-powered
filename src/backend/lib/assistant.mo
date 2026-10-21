import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import List "mo:core/List";
import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessage "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessage";
import ChatCompletionRequestMessageOneOf "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";
import ChatCompletionRequestMessageOneOf3 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf3";
import Types "../types/assistant";

module {
  /// Maximum accepted input length for a single AI request, in characters.
  /// Longer input is rejected with `#tooLong` instead of being truncated.
  public let maxInputChars : Nat = 8000;

  /// System instruction shared by every text endpoint. It keeps replies plain,
  /// short and accessible, which is what the four assistance modules need.
  func systemPrompt() : Text =
    "You are ACCESSAI, an accessibility assistant. Answer in plain, simple language. " #
    "Keep sentences short. Never use jargon, markdown, or emoji. " #
    "If the request is unclear, ask one short clarifying question.";

  /// Build a single-turn user message.
  func userMessage(content : Text) : ChatCompletionRequestMessage.ChatCompletionRequestMessage {
    #user(
      ChatCompletionRequestMessageOneOf2.JSON.init({
        content = #string(content);
        role = #user;
      })
    );
  };

  /// Build an assistant message used to replay prior conversation turns.
  func assistantMessage(content : Text) : ChatCompletionRequestMessage.ChatCompletionRequestMessage {
    #assistant(
      {
        ChatCompletionRequestMessageOneOf3.JSON.init({
          role = #assistant;
        }) with content = ?#string(content)
      }
    );
  };

  /// Build the system message that fixes the assistant's behaviour.
  func systemMessage(content : Text) : ChatCompletionRequestMessage.ChatCompletionRequestMessage {
    #system_(
      ChatCompletionRequestMessageOneOf.JSON.init({
        content = #string(content);
        role = #system_;
      })
    );
  };

  /// Run one chat completion and return the assistant's text.
  ///
  /// `fromEnv<system>()` is read on every call so a credential rotation on a
  /// running canister is picked up. It traps when the app has no inference
  /// credentials; that is a platform condition, not a caller error.
  func complete<system>(
    messages : [ChatCompletionRequestMessage.ChatCompletionRequestMessage],
    maxTokens : Nat,
  ) : async* Text {
    let config = fromEnv<system>();
    let request = {
      ChatCompletionRequest.JSON.init({
        messages;
        model = "router";
      }) with
      temperature = ?0.3;
      max_completion_tokens = ?maxTokens;
    };
    let response = await* ChatApi.createChatCompletion(config, request);
    if (response.choices.size() == 0) {
      Runtime.trap("Inference returned no choices");
    };
    response.choices[0].message.content
      ?? Runtime.trap("Inference returned no text content");
  };

  /// Trim surrounding whitespace and reject empty input.
  func requireText(raw : Text) : ?Text {
    let trimmed = raw.trim(#char ' ');
    if (trimmed.size() == 0) { null } else { ?trimmed };
  };

  /// Send a user message plus optional context to the shared assistant and
  /// return a plain-language reply.
  public func chat<system>(
    request : Types.ChatRequest,
  ) : async Types.AiResult<Types.ChatReply> {
    let ?message = requireText(request.message) else {
      return #err(#emptyInput);
    };
    if (message.size() > maxInputChars) {
      return #err(#tooLong);
    };

    let messages = List.empty<ChatCompletionRequestMessage.ChatCompletionRequestMessage>();
    messages.add(systemMessage(systemPrompt()));
    for (turn in request.context.values()) {
      switch (turn.role) {
        case (#user) { messages.add(userMessage(turn.content)) };
        case (#assistant) { messages.add(assistantMessage(turn.content)) };
      };
    };
    messages.add(userMessage(message));

    let reply = try {
      await* complete<system>(messages.toArray(), 1024);
    } catch (_) {
      return #err(#inferenceUnavailable);
    };
    #ok({ reply; createdAt = Time.now() });
  };

  /// Simplify complex text into easy-to-understand language.
  public func simplify<system>(
    request : Types.SimplifyRequest,
  ) : async Types.AiResult<Text> {
    let ?text = requireText(request.text) else {
      return #err(#emptyInput);
    };
    if (text.size() > maxInputChars) {
      return #err(#tooLong);
    };

    let prompt =
      "Rewrite the text below in very easy language for someone who finds reading hard. " #
      "Use short sentences and common words. Keep every important fact. " #
      "Return only the rewritten text.\n\nText:\n" # text;
    let messages = [systemMessage(systemPrompt()), userMessage(prompt)];

    let simplified = try {
      await* complete<system>(messages, 1024);
    } catch (_) {
      return #err(#inferenceUnavailable);
    };
    #ok(simplified);
  };

  /// Summarize text into a list of key points.
  public func summarize<system>(
    request : Types.SummarizeRequest,
  ) : async Types.AiResult<Types.SummaryResult> {
    let ?text = requireText(request.text) else {
      return #err(#emptyInput);
    };
    if (text.size() > maxInputChars) {
      return #err(#tooLong);
    };

    let prompt =
      "Summarize the text below as a short list of key points. " #
      "Write one key point per line. Do not number the lines. " #
      "Do not add any other text.\n\nText:\n" # text;
    let messages = [systemMessage(systemPrompt()), userMessage(prompt)];

    let raw = try {
      await* complete<system>(messages, 1024);
    } catch (_) {
      return #err(#inferenceUnavailable);
    };
    #ok({ keyPoints = splitLines(raw) });
  };

  /// Turn a task description into ordered step-by-step instructions.
  public func steps<system>(
    request : Types.StepsRequest,
  ) : async Types.AiResult<Types.StepsResult> {
    let ?task = requireText(request.task) else {
      return #err(#emptyInput);
    };
    if (task.size() > maxInputChars) {
      return #err(#tooLong);
    };

    let prompt =
      "Break the task below into clear, ordered steps. " #
      "Write one step per line, starting each line with a number and a period. " #
      "Use simple words. Do not add any other text.\n\nTask:\n" # task;
    let messages = [systemMessage(systemPrompt()), userMessage(prompt)];

    let raw = try {
      await* complete<system>(messages, 1024);
    } catch (_) {
      return #err(#inferenceUnavailable);
    };
    #ok({ steps = splitLines(raw) });
  };

  /// Describe an uploaded image: notable objects and any readable text.
  ///
  /// The platform inference client serves text models only, so this endpoint
  /// never inspects pixels. It describes the image from the filename and the
  /// caller-supplied `context` text (a caption, or text already extracted on
  /// the client). With neither, it returns `#emptyInput` rather than inventing
  /// a description.
  public func describeImage<system>(
    request : Types.DescribeImageRequest,
    filename : Text,
  ) : async Types.AiResult<Types.ImageDescription> {
    let contextText = switch (request.context) {
      case (?c) { requireText(c) };
      case null { null };
    };
    let ?context = contextText else {
      return #err(#emptyInput);
    };
    if (context.size() > maxInputChars) {
      return #err(#tooLong);
    };

    let prompt =
      "The user uploaded an image named \"" # filename # "\". " #
      "Here is the text they provided about it:\n\n" # context # "\n\n" #
      "Write a short, plain-language description of what this image shows, " #
      "based only on that text. Then, on a new line starting with " #
      "\"Readable text:\", list any readable text mentioned. " #
      "If the text does not describe an image, say so plainly.";
    let messages = [systemMessage(systemPrompt()), userMessage(prompt)];

    let raw = try {
      await* complete<system>(messages, 1024);
    } catch (_) {
      return #err(#inferenceUnavailable);
    };
    let (description, readableText) = splitDescription(raw);
    #ok({ description; readableText });
  };

  /// Split a model reply into non-empty, trimmed lines.
  func splitLines(raw : Text) : [Text] {
    let out = List.empty<Text>();
    for (line in raw.split(#char '\n')) {
      let trimmed = line.trim(#char ' ');
      if (trimmed.size() > 0) { out.add(trimmed) };
    };
    out.toArray();
  };

  /// Split a description reply into the description body and the readable-text
  /// section, keyed on the "Readable text:" marker the prompt asks for.
  func splitDescription(raw : Text) : (Text, Text) {
    let marker = "readable text:";
    let lines = raw.split(#char '\n');
    let body = List.empty<Text>();
    let readable = List.empty<Text>();
    var inReadable = false;
    for (line in lines) {
      let trimmed = line.trim(#char ' ');
      if (trimmed.size() == 0) { continue };
      if (trimmed.toLower().startsWith(#text marker)) {
        inReadable := true;
        let rest = Text.fromIter(
          trimmed.toIter().drop(marker.size())
        ).trim(#char ' ');
        if (rest.size() > 0) { readable.add(rest) };
      } else if (inReadable) {
        readable.add(trimmed);
      } else {
        body.add(trimmed);
      };
    };
    (body.toArray().values().join(" "), readable.toArray().values().join(" "));
  };
};
