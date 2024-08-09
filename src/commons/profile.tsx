import { Config, DEFAULT_CONFIG } from "@/commons/config";

export type Profile = {
    name: string;
    config: Config;
    listProfiles: () => Profile[];
    checkProfileName: (name: string) => boolean;
    setProfileName: (name: string) => boolean;
    createProfile: (name: string) => void;
    switchProfile: (name: string) => void;
    deleteProfile: (name: string) => void;
}

export const DEFAULT_PROFILE: Profile = {
    name: 'default',
    config: DEFAULT_CONFIG,
    listProfiles: () => [],
    checkProfileName: (name: string) => false,
    setProfileName: (name: string) => false,
    createProfile: (name: string) => {},
    switchProfile: (name: string) => {},
    deleteProfile: (name: string) => {}
}
