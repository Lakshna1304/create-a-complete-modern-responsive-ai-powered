import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Inlined copies of the app's stable types (migrations must be self-contained).
  type Timestamp = Int;
  type MessageId = Nat;
  type ImageId = Nat;
  type TextSize = { #small; #medium; #large; #extraLarge };
  type AssistanceModule = {
    #visuallyImpaired;
    #deafAndMute;
    #cognitive;
    #mobility;
  };
  type AccessibilityPreferences = {
    highContrast : Bool;
    textSize : TextSize;
  };
  type UserSettings = {
    selectedModule : ?AssistanceModule;
    preferences : AccessibilityPreferences;
    updatedAt : Timestamp;
  };
  type ChatRole = { #user; #assistant };
  type ChatMessage = {
    id : MessageId;
    role : ChatRole;
    content : Text;
    createdAt : Timestamp;
  };
  type ImageRecord = {
    id : ImageId;
    owner : Principal;
    filename : Text;
    blob : Blob;
    description : Text;
    createdAt : Timestamp;
  };

  public type OldActor = {};
  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    settings : Map.Map<Principal, UserSettings>;
    history : Map.Map<Principal, [ChatMessage]>;
    images : Map.Map<ImageId, ImageRecord>;
    imageCounter : { var nextImageId : ImageId };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      settings = Map.empty();
      history = Map.empty();
      images = Map.empty();
      imageCounter = { var nextImageId = 0 };
    };
  };
};
