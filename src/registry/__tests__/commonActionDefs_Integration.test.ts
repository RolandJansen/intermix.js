import "web-audio-test-api";
import TestPlugin from "../../plugins/TestInstrument";
import { store } from "../../store/store";
import commonActionDefs from "../commonActionDefs";
import AbstractRegistry from "../AbstractRegistry";
import { IPlugin, IPluginConstructor, IState } from "../interfaces";
import { bindActionCreators, Reducer } from "redux";
import rootReducer from "../../store/rootReducer";
import combineReducersWithRoot from "../combineReducersWithRoot";
import { addPlugin } from "../../store/rootActions";

/**
 * This as an integration test to check how these actions
 * work in a (nearly) realistic setup.
 */
const ac = new AudioContext();
const itemId = "abcd";
let plug: IPlugin;

class TestRegistry extends AbstractRegistry {
    public itemList = new Map<string, IPlugin>();

    public constructor() {
        super();
    }

    public add(pluginClass: IPluginConstructor): IPlugin {
        const plugin = new pluginClass(itemId, ac);
        plugin.getMyState = jest.fn(() => {
            return {
                ACTION1: 23,
                ACTION2: 42,
            };
        });

        // we have to set a spy on onChange before it subscribes to store
        jest.spyOn(plugin, "onChange");

        this.itemList.set(itemId, plugin);

        // create action creators and bind them to dispatch
        plugin.actionDefs = [...plugin.actionDefs, ...commonActionDefs];
        const actionCreators = this.getActionCreators(plugin.actionDefs, itemId);
        plugin.actionCreators = bindActionCreators(actionCreators, store.dispatch);

        // add reducers to store
        const subReducers = this.getAllSubReducers();
        const reducerTree: Reducer = combineReducersWithRoot(subReducers, rootReducer);
        store.replaceReducer(reducerTree);

        // add plugin state to store and make it observe the store
        store.dispatch(addPlugin(plugin.uid));
        plugin.unsubscribe = this.observeStore(store, plugin);

        return plugin;
    }

    public remove(): void {
        // just to meet the spec
    }
}

const noteValue = ["note", 23, 42, 1, 5];
const volumeValue = ["volume", 1, 5];

beforeEach(() => {
    const registry = new TestRegistry();
    plug = registry.add(TestPlugin);
});

afterEach(() => {
    // we have to reset all state objects under test
    // since we're testing against a real store.
    const clearNote = ["note", 0, 0, 0.0, 0.0];
    const clearVolume = ["volume", 0.0, 0.0];

    plug.actionCreators.note(clearNote);
    plug.actionCreators.volume(clearVolume);
});

// ensure that the TestRegistry works as expected
describe("TestRegistry", () => {
    test("adds common actions to action creators", () => {
        expect(plug.actionCreators.note).toBeDefined();
        expect(plug.actionCreators.loadPreset).toBeDefined();
    });

    test("binds action creators to dispatch", () => {
        plug.actionCreators.note(noteValue);
        const pluginState = store.getState()[plug.uid];
        expect(pluginState.note).toBe(noteValue);
    });
});

describe("basic instrument actions", () => {
    test("plugin receives note actions", () => {
        plug.actionCreators.note(noteValue);
        expect(plug.testValue[1]).toBe(noteValue);
    });

    test("plugin receives volume actions", () => {
        plug.actionCreators.volume(volumeValue);
        expect(plug.testValue[0]).toBe("volume");
        expect(plug.testValue[1]).toBe(volumeValue);
    });
});

describe("preset actions", () => {
    const testPreset: IState = {
        ACTION1: 23,
        ACTION2: 42,
    };

    afterEach(() => {
        plug.actionCreators.ACTION1(0);
        plug.actionCreators.ACTION2(1);
        plug.actionCreators.loadPreset("");
    });

    describe("savePreset", () => {
        test("plugin receives savePreset actions", () => {
            plug.actionCreators.savePreset("myPreset");
            expect(plug.testValue[0]).toBe("savePreset");
            expect(plug.testValue[1]).toBe("myPreset");
        });

        test("sets the preset name in the store", () => {
            // this is based on the former test (not good)
            const savePresetValue = store.getState()[plug.uid].savePreset;
            expect(savePresetValue).toBe("myPreset");
        });

        test("saves the current state to a preset", () => {
            plug.actionCreators.ACTION1(23);
            plug.actionCreators.ACTION2(42);

            plug.actionCreators.savePreset("myPreset");
            const presets: Map<string, IState> = store.getState()[plug.uid].presets;
            expect(presets.has("myPreset")).toBeTruthy();

            const myPreset = presets.get("myPreset");
            expect(myPreset).toEqual(testPreset);
        });
    });

    describe("loadPreset", () => {
        test("plugin receives loadPreset actions", () => {
            plug.actionCreators.loadPreset("myPreset");
            expect(plug.testValue[0]).toBe("loadPreset");
            expect(plug.testValue[1]).toBe("myPreset");
        });

        test("sets the preset name in the store", () => {
            plug.actionCreators.loadPreset("myPreset");
            const loadPresetValue = store.getState()[plug.uid].loadPreset;
            expect(loadPresetValue).toBe("myPreset");
        });

        test("refreshAllValues (AbstractPlugin) loads the values from the store", () => {
            plug.actionCreators.loadPreset("myPreset");
            // onChange should have been called 3 times but since it was
            // mocked before registration there is a first empty call
            // from registry.observeStore()
            expect(plug.onChange).toHaveBeenCalledTimes(4);
            expect((plug.onChange as jest.Mock).mock.calls[1][0]).toStrictEqual(["loadPreset", "myPreset"]);
            expect((plug.onChange as jest.Mock).mock.calls[2][0]).toStrictEqual(["ACTION1", 23]);
            expect((plug.onChange as jest.Mock).mock.calls[3][0]).toStrictEqual(["ACTION2", 42]);
        });
    });

    describe("presetSlotNumber", () => {
        test("changes the preset slot number", () => {
            plug.actionCreators.presetSlotNumber(5);
            expect(store.getState()[plug.uid].presetSlotNumber).toEqual(5);
        });

        test("plugin receives presetSlotNumber actions", () => {
            plug.actionCreators.presetSlotNumber(23);
            expect(plug.testValue[0]).toBe("presetSlotNumber");
            expect(plug.testValue[1]).toBe(23);
        });
    });
});