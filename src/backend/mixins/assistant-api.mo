import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import Common "../types/common";
import Types "../types/assistant";
import AssistantLib "../lib/assistant";
import HistoryLib "../lib/history";

mixin (
  accessControlState : AccessControl.AccessControlState,
  history : Map.Map<Principal, [Common.ChatMessage]>,
  images : Map.Map<Common.ImageId, Common.ImageRecord>,
  imageCounter : { var nextImageId : Common.ImageId },
) {
  /// Reject anonymous callers. Every AI endpoint and every stored record is
  /// keyed to a signed-in principal, so an anonymous caller has no identity to
  /// persist against.
  func requireSignedIn(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign in to use the assistant");
    };
  };

  /// Shared assistant chat: takes a message plus optional context, returns a
  /// plain-language reply, and persists both turns for the caller.
  public shared ({ caller }) func chat(
    request : Types.ChatRequest,
  ) : async Types.AiResult<Types.ChatReply> {
    requireSignedIn(caller);
    let result = await AssistantLib.chat<system>(request);
    switch (result) {
      case (#ok(reply)) {
        ignore HistoryLib.appendMessage(history, caller, #user, request.message);
        ignore HistoryLib.appendMessage(history, caller, #assistant, reply.reply);
        #ok(reply);
      };
      case (#err(e)) { #err(e) };
    };
  };

  /// Simplify complex text into easy-to-understand language.
  public shared ({ caller }) func simplifyText(
    request : Types.SimplifyRequest,
  ) : async Types.AiResult<Text> {
    requireSignedIn(caller);
    await AssistantLib.simplify<system>(request);
  };

  /// Summarize text into key points.
  public shared ({ caller }) func summarizeText(
    request : Types.SummarizeRequest,
  ) : async Types.AiResult<Types.SummaryResult> {
    requireSignedIn(caller);
    await AssistantLib.summarize<system>(request);
  };

  /// Turn a task description into ordered steps.
  public shared ({ caller }) func generateSteps(
    request : Types.StepsRequest,
  ) : async Types.AiResult<Types.StepsResult> {
    requireSignedIn(caller);
    await AssistantLib.steps<system>(request);
  };

  /// Store an uploaded image and return its reference id.
  ///
  /// The bytes live in object storage; the canister keeps only the reference
  /// plus the filename, keyed to the caller.
  public shared ({ caller }) func uploadImage(
    filename : Text,
    blob : Storage.ExternalBlob,
  ) : async Types.AiResult<Common.ImageId> {
    requireSignedIn(caller);
    let id = imageCounter.nextImageId;
    imageCounter.nextImageId := id + 1;
    let record : Common.ImageRecord = {
      id;
      owner = caller;
      filename;
      blob;
      description = "";
      createdAt = Time.now();
    };
    images.add(id, record);
    #ok(id);
  };

  /// Describe an uploaded image: notable objects and readable text.
  ///
  /// The platform inference client serves text models only, so the description
  /// is produced from the filename and the caller-supplied `context` text.
  /// Without context the endpoint returns `#emptyInput` instead of inventing a
  /// description.
  public shared ({ caller }) func describeImage(
    request : Types.DescribeImageRequest,
  ) : async Types.AiResult<Types.ImageDescription> {
    requireSignedIn(caller);
    let ?record = images.get(request.imageId) else {
      return #err(#notFound);
    };
    if (record.owner != caller) {
      return #err(#unauthorized);
    };
    let result = await AssistantLib.describeImage<system>(request, record.filename);
    switch (result) {
      case (#ok(description)) {
        images.add(request.imageId, { record with description = description.description });
        #ok(description);
      };
      case (#err(e)) { #err(e) };
    };
  };

  /// Return the caller's saved conversation history, oldest first.
  public query ({ caller }) func getChatHistory() : async [Common.ChatMessage] {
    HistoryLib.listMessages(history, caller);
  };

  /// Remove all saved conversation history for the caller.
  public shared ({ caller }) func clearChatHistory() : async () {
    requireSignedIn(caller);
    HistoryLib.clearMessages(history, caller);
  };
};
