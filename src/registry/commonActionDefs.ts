import { IOscActionDef, reducerLogic, IState, IAction } from "./interfaces";
import { AnyAction } from "redux";

const loadPreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    return {};
};

const savePreset: reducerLogic = (mySubState: IState, action: AnyAction | IAction): IState => {
    return {};
};

const PREFIX = "/intermix/plugin/<UID>/";

/**
 * Definitions of actions that every
 * instrument plugin can handle (but don't need to).
 */
const commonActionDefs: IOscActionDef[] = [
    {
        address: PREFIX + "note",
        typeTag: ",siiff",
        value: ["note", 0, 0, 0.0, 0.0],
        description: "name, note-value, velocity, duration, starttime",
    },
    {
        address: PREFIX + "volume",
        typeTag: ",sff",
        value: ["volume", 0.0, 0.0],
        description: "name, loudness-value, starttime",
    },
    {
        address: PREFIX + "loadPreset",
        typeTag: ",i",
        process: loadPreset,
        description: "loads a preset and changes the preset number accordingly",
    },
    {
        address: PREFIX + "savePreset",
        typeTag: ",i",
        process: savePreset,
        description: "saves all properties defined in 'actionDefs' and changes the preset number accordingly",
    },
    {
        address: PREFIX + "importPreset",
        typeTag: ",is",
        description: "deserializes a json string into a preset object",
    },
    {
        address: PREFIX + "exportPreset",
        typeTag: "s",
        description: "serializes a preset object into a json string",
    },
    {
        address: PREFIX + "importPresetList",
        typeTag: ",s",
        description: "deserializes a json string into an array of presets and replaces the current one",
    },
    {
        address: PREFIX + "exportPresetList",
        typeTag: ",s",
        description: "serializes all current presets into a json string",
    },
];

export default commonActionDefs;
