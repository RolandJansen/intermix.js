import { Action, ActionCreatorsMapObject } from "redux";
import { IState, AudioEndpoint } from "./interfaces/interfaces";
import { IPluginConstructor, IPluginClassContainer } from "./interfaces/IRegistryItems";
import MasterRegistry from "./registry/MasterRegistry";
import { store } from "./store/store";
import Sequencer from "./plugins/Sequencer/Sequencer";
import Sampler from "./plugins/Sampler";
import Synth from "./plugins/Synth";
import Delay from "./plugins/Delay";

// system components
const audioContext: AudioContext = new AudioContext();
const registry: MasterRegistry = new MasterRegistry(audioContext);

export const pluginClasses: IPluginClassContainer = {
    Sequencer,
    Sampler,
    Synth,
    Delay,
};

export function getPluginClassNames(): string[] {
    return Object.keys(pluginClasses);
}

export function getState(): IState {
    return store.getState();
}

export function dispatch(action: Action): void {
    store.dispatch(action);
}

// useful if the browser doesn't allow ac to start
export function resumeAudioContext(): void {
    audioContext.resume();
}

export function getAudioContext(): AudioContext {
    return audioContext;
}

// type GenericPluginClass = new (itemId: string, ac: AudioContext) => IPlugin;

export function addPluginClass(PluginClass: IPluginConstructor): void {
    const pluginName = PluginClass.METADATA.name;
    pluginClasses[pluginName] = PluginClass;
}

export function removePluginClass(className: string): boolean {
    return delete pluginClasses[className];
}

/**
 * Tries to find a class (prototype) with the name of a given string (reflection),
 * then tries to cast it to a valid plugin class.
 * If both worked, a plugin instance will be created, registered etc.
 * and the item-id will be returned
 * @param pluginClassName The name of the class from which a plugin instance should be created
 */
export function addPlugin(pluginClassName: string): string {
    if (pluginClasses.hasOwnProperty(pluginClassName)) {
        const possibleClass: any = (pluginClasses as any)[pluginClassName];
        const pluginClass: IPluginConstructor = possibleClass as IPluginConstructor;

        return registry.addPlugin(pluginClass);
    }
    return "";
}

export function removePlugin(itemId: string): void {
    registry.removePlugin(itemId);
}

export function addSeqPart(lengthInStepsPerBar?: number): string {
    if (lengthInStepsPerBar) {
        return registry.addSeqPart(lengthInStepsPerBar);
    } else {
        return registry.addSeqPart();
    }
}

export function removeSeqPart(itemId: string): void {
    registry.removeSeqPart(itemId);
}

export function getActionCreators(itemId: string): ActionCreatorsMapObject {
    return registry.getActionCreators(itemId);
}

export function getUnboundActionCreators(itemId: string): ActionCreatorsMapObject {
    return registry.getActionCreators(itemId, "unbound");
}

/**
 * Connects two audio endpoints and dispatches the new state.
 * If the id of the input plugin is not valid, it connects to the soundcard input.
 * If the id of the output plugin is not valid, it cancels the operation.
 * @param connection Audio endpoints to be connected
 */
export function connectPlugins(output: AudioEndpoint, input: AudioEndpoint): void {
    const connection: [AudioEndpoint, AudioEndpoint] = [output, input];
    registry.connectAudioNodes(connection);
}

// API for plugin developers
export * from "./interfaces/interfaces";
export * from "./interfaces/IActions";
export * from "./interfaces/IRegistryItems";
export { AbstractPlugin } from "./registry/AbstractPlugin";
export { AbstractControllerPlugin } from "./registry/AbstractControllerPlugin";
export { createInlineWorker, loadFileFromServer } from "./fileLoader";
