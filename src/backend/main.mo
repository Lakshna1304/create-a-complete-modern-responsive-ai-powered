import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Common "types/common";
import ProfileTypes "types/profile";
import AssistantApi "mixins/assistant-api";
import ProfileApi "mixins/profile-api";
import ApiDocMixin "mixins/api-doc";

actor {
  /// Project the optional assistance module to a queryable text column.
  func moduleToText(module_ : ?Common.AssistanceModule) : Text {
    switch (module_) {
      case null { "none" };
      case (?#visuallyImpaired) { "visuallyImpaired" };
      case (?#deafAndMute) { "deafAndMute" };
      case (?#cognitive) { "cognitive" };
      case (?#mobility) { "mobility" };
    };
  };

  /// Project the text-size variant to a queryable text column.
  func textSizeToText(size : Common.TextSize) : Text {
    switch (size) {
      case (#small) { "small" };
      case (#medium) { "medium" };
      case (#large) { "large" };
      case (#extraLarge) { "extraLarge" };
    };
  };

  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  include MixinObjectStorage();

  let settings : Map.Map<Principal, ProfileTypes.UserSettings>;
  let history : Map.Map<Principal, [Common.ChatMessage]>;
  let images : Map.Map<Common.ImageId, Common.ImageRecord>;
  let imageCounter : { var nextImageId : Common.ImageId };

  include ProfileApi(accessControlState, settings);
  include AssistantApi(accessControlState, history, images, imageCounter);

  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  /// Settings rows keyed by owner, with the owner promoted to a column so the
  /// entity can scope each signed-in caller to its own row.
  func settingsRows() : Iter.Iter<(Principal, ProfileTypes.UserSettings)> {
    settings.entries();
  };

  include Expose({
    entities = [
      // Per-user settings: each signed-in caller reads only their own row.
      // Manual mode — the row carries a nested record and a variant, which
      // auto-derivation cannot project.
      Entity.manual<(Principal, ProfileTypes.UserSettings)>(
        "userSettings",
        settingsRows,
        "UserSettings",
        "updatedAt",
      )
        .sample((
          samplePrincipal,
          {
            selectedModule = null;
            preferences = { highContrast = false; textSize = #medium };
            updatedAt = 0;
          },
        ))
        .payload("owner", func ((p, _)) = p)
        .payload("selectedModule", func ((_, s)) = moduleToText(s.selectedModule))
        .payload("highContrast", func ((_, s)) = s.preferences.highContrast)
        .payload("textSize", func ((_, s)) = textSizeToText(s.preferences.textSize))
        .payload("updatedAt", func ((_, s)) = s.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // Uploaded image references, scoped to their owner. Manual mode — the
      // record carries a Blob, which auto-derivation cannot project.
      Entity.manual<Common.ImageRecord>(
        "image",
        func () = images.values(),
        "ImageRecord",
        "id",
      )
        .sample({
          id = 0;
          owner = samplePrincipal;
          filename = "";
          blob = "" : Blob;
          description = "";
          createdAt = 0;
        })
        .payload("id", func (r) = r.id)
        .payload("owner", func (r) = r.owner)
        .payload("filename", func (r) = r.filename)
        .payload("description", func (r) = r.description)
        .payload("createdAt", func (r) = r.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });

  include ApiDocMixin();
};
