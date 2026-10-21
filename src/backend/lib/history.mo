import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";

module {
  /// Maximum number of conversation turns kept per user. Older turns are
  /// dropped so a long-running conversation cannot grow without bound.
  public let maxMessages : Nat = 200;

  /// Append a conversation turn for the caller and return the stored message.
  public func appendMessage(
    history : Map.Map<Principal, [Common.ChatMessage]>,
    caller : Principal,
    role : Common.ChatRole,
    content : Text,
  ) : Common.ChatMessage {
    let existing = history.get(caller) ?? [];
    let nextId = existing.size();
    let message : Common.ChatMessage = {
      id = nextId;
      role;
      content;
      createdAt = Time.now();
    };
    let appended = existing.concat([message]);
    let bounded = if (appended.size() > maxMessages) {
      let drop : Int = appended.size().toInt() - maxMessages.toInt();
      appended.sliceToArray(drop, appended.size().toInt());
    } else {
      appended;
    };
    history.add(caller, bounded);
    message;
  };

  /// Return the caller's saved conversation history, oldest first.
  public func listMessages(
    history : Map.Map<Principal, [Common.ChatMessage]>,
    caller : Principal,
  ) : [Common.ChatMessage] {
    history.get(caller) ?? [];
  };

  /// Remove all saved conversation history for the caller.
  public func clearMessages(
    history : Map.Map<Principal, [Common.ChatMessage]>,
    caller : Principal,
  ) : () {
    history.remove(caller);
  };
};
