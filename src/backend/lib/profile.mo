import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/profile";

module {
  /// Default settings for a caller who has never saved any.
  public func defaults() : Types.UserSettings {
    {
      selectedModule = null;
      preferences = { highContrast = false; textSize = #medium };
      updatedAt = 0;
    };
  };

  /// Read the caller's persisted settings, creating defaults when absent.
  public func getSettings(
    settings : Map.Map<Principal, Types.UserSettings>,
    caller : Principal,
  ) : Types.UserSettings {
    settings.get(caller) ?? defaults();
  };

  /// Persist the caller's selected assistance module.
  public func setSelectedModule(
    settings : Map.Map<Principal, Types.UserSettings>,
    caller : Principal,
    module_ : Common.AssistanceModule,
  ) : Types.UserSettings {
    let current = getSettings(settings, caller);
    let updated : Types.UserSettings = {
      selectedModule = ?module_;
      preferences = current.preferences;
      updatedAt = Time.now();
    };
    settings.add(caller, updated);
    updated;
  };

  /// Persist the caller's accessibility preferences.
  public func setPreferences(
    settings : Map.Map<Principal, Types.UserSettings>,
    caller : Principal,
    preferences : Common.AccessibilityPreferences,
  ) : Types.UserSettings {
    let current = getSettings(settings, caller);
    let updated : Types.UserSettings = {
      selectedModule = current.selectedModule;
      preferences;
      updatedAt = Time.now();
    };
    settings.add(caller, updated);
    updated;
  };
};
