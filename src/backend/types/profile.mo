import Common "common";

module {
  public type Timestamp = Common.Timestamp;
  public type AssistanceModule = Common.AssistanceModule;
  public type AccessibilityPreferences = Common.AccessibilityPreferences;
  public type TextSize = Common.TextSize;

  /// Per-user persisted settings: selected module and accessibility prefs.
  public type UserSettings = {
    selectedModule : ?AssistanceModule;
    preferences : AccessibilityPreferences;
    updatedAt : Timestamp;
  };
};
