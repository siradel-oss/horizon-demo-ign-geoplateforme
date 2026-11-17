import { HrzApi } from "@siradel-oss/horizon-api";
import type { HrzCoreBackend } from "@siradel-oss/horizon-core";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { ref, type Ref } from "vue";

export type MessageType = Exclude<HrzProtocol.TypedMessage["payload"], undefined>;

export class HorizonService {
    public api: Ref<HrzApi.AsyncApi | null> = ref(null);
    private messageHandlersByType: Map<
        MessageType,
        ((message: HrzProtocol.TypedMessage.$Shape) => void)[]
    > = new Map();

    async initialize(backend: HrzCoreBackend) {
        this.api.value = new HrzApi.AsyncApi(backend);
        setInterval(() => this.receiveMessages(), 50);
    }

    getApi(): HrzApi.AsyncApi | null {
        return this.api.value;
    }

    onMessage(type: MessageType, handler: (message: HrzProtocol.TypedMessage.$Shape) => void) {
        let handlers = this.messageHandlersByType.get(type);
        if (!handlers) {
            handlers = [];
            this.messageHandlersByType.set(type, handlers);
        }
        handlers.push(handler);
    }

    private async receiveMessages() {
        let api = this.api.value;
        if (!api) return;

        while (true) {
            let dequeued = await api.MessageQueueService.dequeueMessages({
                maxMessageCount: 20,
            });
            if (dequeued.messages.length === 0 && (dequeued.queueSize?.messageCount || 0) === 0) {
                break;
            }

            for (let message of dequeued.messages) {
                if (!message.payload) continue;
                let handlers = this.messageHandlersByType.get(message.payload);
                if (handlers) {
                    for (let handler of handlers) {
                        handler(message);
                    }
                }
            }
        }
    }
}

export const horizonService = new HorizonService();
