interface PatchFunction {
  (localStorage: Storage): void;
}

interface Patch {
  version: number;
  execute: PatchFunction;
}

export class LocalStoragePatch {
  private static readonly VERSION_KEY = 'storage_patch_version';
  private patches: Patch[] = [];
  private currentVersion: number;

  constructor() {
    // Get the current patch version from localStorage, default to 0 if not set
    const storedVersion = localStorage.getItem(LocalStoragePatch.VERSION_KEY);
    this.currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
  }

  /**
   * Register a new patch to be executed
   * @param version The version number for this patch
   * @param patchFn The function to execute for this patch
   */
  registerPatch(version: number, patchFn: PatchFunction) {
    this.patches.push({
      version,
      execute: patchFn,
    });

    // Sort patches by version to ensure they run in order
    this.patches.sort((a, b) => a.version - b.version);
  }

  /**
   * Execute all pending patches that haven't been run yet
   */
  applyPatches() {
    const pendingPatches = this.patches.filter(
      (patch) => patch.version > this.currentVersion
    );

    if (pendingPatches.length === 0) {
      return;
    }

    for (const patch of pendingPatches) {
      try {
        patch.execute(localStorage);
        this.currentVersion = patch.version;
        localStorage.setItem(
          LocalStoragePatch.VERSION_KEY,
          this.currentVersion.toString()
        );
      } catch (error) {
        console.error(`Error applying patch version ${patch.version}:`, error);
        // Stop applying patches if one fails to prevent potential data corruption
        break;
      }
    }
  }

  /**
   * Get the current patch version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }
}

// Example usage:
/*
const storagePatch = new LocalStoragePatch();

// Register patches
storagePatch.registerPatch(1, (storage) => {
  // Example: Rename a key
  const oldValue = storage.getItem('oldKey');
  if (oldValue) {
    storage.setItem('newKey', oldValue);
    storage.removeItem('oldKey');
  }
});

storagePatch.registerPatch(2, (storage) => {
  // Example: Update data structure
  const data = storage.getItem('userPreferences');
  if (data) {
    const oldPrefs = JSON.parse(data);
    const newPrefs = {
      ...oldPrefs,
      newFeature: true
    };
    storage.setItem('userPreferences', JSON.stringify(newPrefs));
  }
});

// Apply all pending patches
storagePatch.applyPatches();
*/
