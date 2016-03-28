import Channels from './channels/channels';
import Channel from './channels/channel';
import { default as EventsDispatcher } from './events/dispatcher';
import Timeline from './timeline/timeline';
import TimelineSender from './timeline/timeline_sender';
import ConnectionManager from './connection/connection_manager';
import { PeriodicTimer } from './utils/timers';
export default class Pusher {
    static instances: Pusher[];
    static isReady: boolean;
    static Runtime: any;
    static ScriptReceivers: any;
    static DependenciesReceivers: any;
    static ready(): void;
    static logToConsole(): void;
    static setLogger(logger: Function): void;
    key: string;
    config: any;
    channels: Channels;
    global_emitter: EventsDispatcher;
    sessionID: number;
    timeline: Timeline;
    timelineSender: TimelineSender;
    connection: ConnectionManager;
    timelineSenderTimer: PeriodicTimer;
    constructor(app_key: string, options: any);
    channel(name: string): Channel;
    allChannels(): Channel[];
    connect(): void;
    disconnect(): void;
    bind(event_name: string, callback: Function): Pusher;
    bind_all(callback: Function): Pusher;
    subscribeAll(): void;
    subscribe(channel_name: string): Channel;
    unsubscribe(channel_name: string): void;
    send_event(event_name: string, data: any, channel: string): boolean;
    isEncrypted(): boolean;
}