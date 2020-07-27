import AbstractPlugin from "../registry/AbstractPlugin";
import { IPlugin, IPluginMetaData, Tuple, IOscActionDef } from "../registry/interfaces";

/**
 * This class will be used to indirectly
 * test the abstract class and registry.
 * Implementation doesn't matter and
 * is not subject to tests.
 */
export default class TestInstrument extends AbstractPlugin implements IPlugin {
    public readonly metaData: IPluginMetaData = {
        type: "instrument",
        name: "Test-Instrument",
        version: "1.0.0",
        authors: "Roland Jansen",
        desc: "The simplest possible plugin to be used in tests",
    };
    public actionDefs: IOscActionDef[] = [
        {
            address: "/intermix/plugin/<UID>/ACTION1",
            typeTag: ",i",
            value: 0,
            range: [0, 127],
            description: "action one",
        },
        {
            address: "/intermix/plugin/<UID>/ACTION2",
            typeTag: ",i",
            value: 1,
            range: [0, 127],
            description: "action two",
        },
    ];

    // here we can check if onChange was called correctly without mocking
    public testValue: Tuple = ["", 0];

    public get inputs(): AudioNode[] {
        return [];
    }

    public get outputs(): AudioNode[] {
        return [];
    }

    constructor(public readonly uid: string, private ac: AudioContext) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onChange(changed: Tuple): boolean {
        // console.log(changed);
        if (changed[0] === "loadPreset") {
            this.refreshAllValues();
        }
        this.testValue = changed;
        return true;
    }
}
