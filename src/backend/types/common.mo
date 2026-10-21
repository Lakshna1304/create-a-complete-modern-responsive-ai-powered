import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// Nanosecond timestamp from `Time.now()` (signed Int).
  public type Timestamp = Int;

  /// Identifier for a saved conversation message.
  public type MessageId = Nat;

  /// Identifier for an uploaded image reference.
  public type ImageId = Nat;

  /// The four assistance modules the AI core routes to.
  public type AssistanceModule = {
    #visuallyImpaired;
    #deafAndMute;
    #cognitive;
    #mobility;
  };

  /// Accessibility preferences persisted per user.
  public type AccessibilityPreferences = {
    highContrast : Bool;
    textSize : TextSize;
  };

  /// Adjustable text size setting.
  public type TextSize = {
    #small;
    #medium;
    #large;
    #extraLarge;
  };

  /// Role of a chat turn in a conversation.
  public type ChatRole = {
    #user;
    #assistant;
  };

  /// A single persisted conversation turn.
  public type ChatMessage = {
    id : MessageId;
    role : ChatRole;
    content : Text;
    createdAt : Timestamp;
  };

  /// A saved image reference plus its generated description.
  public type ImageRecord = {
    id : ImageId;
    owner : Principal;
    filename : Text;
    blob : Storage.ExternalBlob;
    description : Text;
    createdAt : Timestamp;
  };

  /// Failure result the frontend can show with a retry option.
  public type AiError = {
    #inferenceUnavailable;
    #emptyInput;
    #tooLong;
    #notFound;
    #unauthorized;
  };

  /// Result wrapper for every AI endpoint.
  public type AiResult<T> = {
    #ok : T;
    #err : AiError;
  };
};
