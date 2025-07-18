import { LocalStoragePatch } from './localstoragepatch';

/**
 * Register all localStorage patches here
 */
export function registerPatches(storagePatch: LocalStoragePatch) {

    storagePatch.registerPatch(1, (storage) => {
        storage.setItem('hehechat-jingleExtra', '0');
        storage.setItem('hehechat-ttsExtra', '0');
    });
/*
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
    */
}

/**
 * Initialize and apply all localStorage patches
 */
export function initializeStoragePatches() {
    const storagePatch = new LocalStoragePatch();
    registerPatches(storagePatch);
    storagePatch.applyPatches();
}
