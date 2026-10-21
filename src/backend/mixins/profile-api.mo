import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/profile";
import ProfileLib "../lib/profile";

mixin (
  accessControlState : AccessControl.AccessControlState,
  settings : Map.Map<Principal, Types.UserSettings>,
) {
  /// Reject anonymous callers: settings are persisted per signed-in principal.
  func requireCaller(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign in to save your settings");
    };
  };

  /// Return the caller's persisted settings (module + accessibility prefs).
  public query ({ caller }) func getMySettings() : async Types.UserSettings {
    ProfileLib.getSettings(settings, caller);
  };

  /// Persist the caller's selected assistance module.
  public shared ({ caller }) func setSelectedModule(
    module_ : Common.AssistanceModule,
  ) : async Types.UserSettings {
    requireCaller(caller);
    ProfileLib.setSelectedModule(settings, caller, module_);
  };

  /// Persist the caller's accessibility preferences.
  public shared ({ caller }) func setAccessibilityPreferences(
    preferences : Common.AccessibilityPreferences,
  ) : async Types.UserSettings {
    requireCaller(caller);
    ProfileLib.setPreferences(settings, caller, preferences);
  };
};
