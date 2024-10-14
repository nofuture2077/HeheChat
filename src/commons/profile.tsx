import { Config, DEFAULT_CONFIG } from "@/commons/config";

export type Profile = {
    name: string;
    guid: string;
    config: Config;
    index: number;
    listProfiles: () => Profile[];
    checkProfileName: (name: string) => boolean;
    setProfileName: (name: string) => void;
    createProfile: (name: string) => void;
    switchProfile: (guid: string) => void;
    deleteProfile: (guid: string) => void;
    setProfiles: (profiles: Profile[]) => void;
}

export const DEFAULT_PROFILE: Profile = {
    name: 'default',
    guid: '',
    config: DEFAULT_CONFIG,
    index: 0,
    listProfiles: () => [],
    checkProfileName: (name: string) => false,
    setProfileName: (name: string) => {},
    createProfile: (name: string) => {},
    switchProfile: (guid: string) => {},
    deleteProfile: (guid: string) => {},
    setProfiles: (profiles: Profile[]) => {}
}
