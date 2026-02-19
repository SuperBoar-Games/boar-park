// SSE (Server-Sent Events) manager for real-time broadcast to all connected clients

import { randomUUID } from "crypto";

interface SSEClient {
    id: string;
    controller: ReadableStreamDefaultController<Uint8Array>;
}

const clients = new Set<SSEClient>();

const encoder = new TextEncoder();

export function addSSEClient(controller: ReadableStreamDefaultController<Uint8Array>): string {
    const id = randomUUID();
    clients.add({ id, controller });
    return id;
}

export function removeSSEClient(id: string): void {
    for (const client of clients) {
        if (client.id === id) {
            clients.delete(client);
            break;
        }
    }
}

export function broadcast(event: string, data: object): void {
    const message = encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    const dead = new Set<SSEClient>();

    for (const client of clients) {
        try {
            client.controller.enqueue(message);
        } catch {
            // Client disconnected — clean up after iteration
            dead.add(client);
        }
    }

    for (const client of dead) {
        clients.delete(client);
    }
}

export function getClientCount(): number {
    return clients.size;
}
