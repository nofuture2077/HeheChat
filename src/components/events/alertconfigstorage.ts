import { BaseStorage, StoreSchema } from "@/commons/database";
import { EventAlertConfig, EventAlertMeta, EventAlertData } from "@/commons/events";

const STORE_NAME = 'alertConfig';

const alertConfigSchema: StoreSchema = {
    name: STORE_NAME,
    keyPath: 'meta.channel'
};

class AlertConfigStorage extends BaseStorage<EventAlertConfig> {
    constructor() {
        super(alertConfigSchema);
    }

    async storeConfig(meta: EventAlertMeta, data: EventAlertData): Promise<void> {
        await this.put({
            meta,
            data
        });
    }

    async getConfig(channelId: string): Promise<EventAlertConfig | null> {
        const store = await this.getStore();
        return new Promise((resolve, reject) => {
            const index = store.index('channel');
            const request = index.get(channelId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteConfig(channelId: string): Promise<void> {
        const config = await this.getConfig(channelId);
        if (config) {
            await this.delete(config.meta.guid);
        }
    }
}

export const AlertConfigStore = new AlertConfigStorage();
