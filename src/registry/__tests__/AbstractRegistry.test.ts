/* eslint-disable @typescript-eslint/camelcase */
import { ActionCreatorsMapObject, Reducer, ReducersMapObject } from "redux";
import { store } from "../../store/store";
import AbstractRegistry from "../AbstractRegistry";
import { IActionHandlerMap, IState, Tuple } from "../../interfaces/interfaces";
import { ICoreAction, IOscAction, IOscActionDef } from "../../interfaces/IActions";
import { IRegistryItem } from "../../interfaces/IRegistryItems";

// instruct Jest to use the mock class
// instead of the real one globaly.
jest.mock("../../store/store");

const testActionDefs: IOscActionDef[] = [
    {
        address: "/test/<UID>/ACTION1",
        typeTag: "i",
        value: 23,
        description: "Does nothing",
    },
    {
        address: "/ACTION2",
        typeTag: "i",
        value: 42,
        description: "Does nothing also",
    },
];

/**
 * A bare RegistryItem so we don't depend on
 * real world code
 */
class TestItem implements IRegistryItem {
    public uid = "";

    public readonly actionDefs: IOscActionDef[] = testActionDefs;
    public actionCreators: ActionCreatorsMapObject = {};
    public unboundActionCreators: ActionCreatorsMapObject = {};
    public initState: IState = {};

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onChange(changed: Tuple): boolean {
        return true;
    }

    public unsubscribe(): void {
        // will be overridden by the registry
    }
}

/**
 * A bare registry class that extends
 * AbstractRegistry and becomes the
 * object under test.
 */
class TestRegistry extends AbstractRegistry {
    public itemList = new Map<string, TestItem>();
    public itemActionDefs: IOscActionDef[];

    constructor() {
        super();
        this.itemActionDefs = testActionDefs;
    }

    public add(): TestItem {
        const newItem = new TestItem();
        newItem.uid = this.getUniqueItemKey();
        this.itemList.set(newItem.uid, newItem);
        return newItem;
    }

    public remove(uid: string): void {
        this.itemList.delete(uid);
    }

    // from here on downwards are methods
    // to make private methods public to make them testable
    public selectSubState_Test(globalState: IState, uid: string): IState {
        return this.selectSubState(globalState, uid);
    }

    public getChanged_Test(currentState: IState, nextState: IState): Tuple[] {
        return this.getChanged(currentState, nextState);
    }

    public getActionCreators_Test(actionDefs: IOscActionDef[], uid: string): ActionCreatorsMapObject {
        return this.getActionCreators(actionDefs, uid);
    }

    public getInitialState_Test(actionDefs: IOscActionDef[], uid: string): IState {
        return this.getInitialState(uid, actionDefs);
    }

    public getActionHandlers_Test(actionDefs: IOscActionDef[]): IActionHandlerMap {
        return this.getActionHandlers(actionDefs);
    }

    public getSubReducer_Test(actionDefs: IOscActionDef[], initialState: IState): Reducer {
        return this.getSubReducer(actionDefs, initialState);
    }
}

const testState = {
    ACTION1: 5,
    ACTION2: 6,
};
let registry: TestRegistry;
let testItem: TestItem;
let testItemUid: string;

beforeEach(() => {
    store.getState = jest.fn();
    (store.getState as jest.Mock).mockReturnValue({
        plugins: [],
        seqparts: [],
    });
    registry = new TestRegistry();
    testItem = registry.add();
    testItemUid = testItem.uid;
});

test("creates action creators from action defs", () => {
    const adefs = testItem.actionDefs;
    const actionCreators = registry.getActionCreators_Test(adefs, testItemUid);
    const action: IOscAction = actionCreators.ACTION1(555);
    expect(action.address).toMatch(`/test/${testItemUid}/ACTION1`);
    expect(action.type).toMatch("ACTION1");
    expect(action.payload).toEqual(555);
});

test("creates action handlers (sub reducers)", () => {
    const handlers = registry.getActionHandlers_Test(testItem.actionDefs);
    const newState1 = handlers.ACTION1(testState, {
        type: "ACTION1",
        payload: 23,
    });
    expect(newState1.ACTION1).toEqual(23);
    expect(testState.ACTION1).toEqual(5); // old state shouldn't be altered
});

describe("getInitialState", () => {
    let initState: IState;

    beforeEach(() => {
        initState = registry.getInitialState_Test(testItem.actionDefs, testItemUid);
    });

    test("builds the initial state from action defs", () => {
        expect(initState.ACTION1).toEqual(23);
        expect(initState.ACTION2).toEqual(42);
    });

    test("adds an uid field to the initial state", () => {
        expect(initState.uid).toMatch(testItemUid);
    });

    test("adds an actionDefs field to the initial state", () => {
        expect(initState.actionDefs).toEqual(testItem.actionDefs);
    });

    test("copies actionDefs by value", () => {
        expect(initState.actionDefs).not.toBe(testItem.actionDefs);
    });
});

describe("getSubReducer -> reducer", () => {
    let iniState: IState;
    let adefs: IOscActionDef[];
    let testReducer: Reducer;

    beforeEach(() => {
        iniState = Object.assign({}, testState, { uid: testItemUid });
        adefs = testItem.actionDefs;
        testReducer = registry.getSubReducer_Test(adefs, iniState);
    });

    test("returns the initial state if called with no args", () => {
        const returnedState = testReducer(undefined, { type: "" });
        expect(returnedState).toEqual(iniState);
    });

    test("returns the original state if called with unknown action", () => {
        expect(testReducer(iniState, { type: "" })).toEqual(iniState);
    });

    test("returns the original state if action.dest doesn't match", () => {
        expect(
            testReducer(iniState, {
                dest: "123",
                type: "ACTION1",
                payload: 23,
            })
        ).toEqual(iniState);
    });

    test("should handle ACTION1", () => {
        expect(
            testReducer([], {
                type: "ACTION1",
                payload: 23,
            })
        ).toEqual({ ACTION1: 23 });
    });

    test("should handle ACTION2", () => {
        expect(
            testReducer([], {
                type: "ACTION2",
                payload: 23,
            })
        ).toEqual({ ACTION2: 23 });
    });

    test("returns a new state if action is valid (copy by val)", () => {
        const newState = testReducer(iniState, {
            listener: testItemUid,
            type: "ACTION1",
            payload: 23,
        });
        expect(newState.ACTION1).toEqual(23);
        expect(iniState.ACTION1).toEqual(5);
    });
});

describe("selectSubState and getChanged", () => {
    test("selectSubState returns an empty object if uid is not in state", () => {
        expect(registry.selectSubState_Test(testState, "abcd")).toEqual({});
    });

    test("selectSubState returns the corresponding sub-state", () => {
        const subState = registry.selectSubState_Test(testState, "ACTION1");
        expect(subState).toEqual(5);
    });

    test("getChanged diffs two states and returns the changed value", () => {
        const nextState = Object.assign({}, testState, { ACTION2: { uid: 23 } });
        const changed = registry.getChanged_Test(testState, nextState);
        expect(changed[0][0]).toEqual("ACTION2");
        expect(changed[0][1]).toEqual({ uid: 23 });
    });

    test("getChanged returns all changed values", () => {
        const nextState = Object.assign({}, testState, {
            ACTION1: 23,
            ACTION2: 42,
        });
        const changed = registry.getChanged_Test(testState, nextState);
        expect(changed[0][0]).toEqual("ACTION1");
        expect(changed[0][1]).toEqual(23);
        expect(changed[1][0]).toEqual("ACTION2");
        expect(changed[1][1]).toEqual(42);
    });

    test("getChanged returns an emtpy array if no change happened", () => {
        const nextState = Object.assign({}, testState);
        const changed = registry.getChanged_Test(testState, nextState);
        expect(changed).toHaveLength(0);
    });
});

describe("observeStore", () => {
    beforeEach(() => {
        const iniState = registry.getInitialState_Test(testItem.actionDefs, testItemUid);

        // tslint:disable-next-line: variable-name
        const globalState_Test = {
            [testItemUid]: iniState,
        };

        (store.getState as jest.Mock).mockImplementation(() => globalState_Test);
        (store.subscribe as jest.Mock).mockImplementation(() => {
            return (): boolean => true;
        });
        (store.subscribe as jest.Mock).mock.calls = []; // reset call history
    });

    test("subscribes to the store", () => {
        expect(store.subscribe).not.toHaveBeenCalled();
        registry.observeStore(store, testItem);
        expect(store.subscribe).toHaveBeenCalled();
    });

    test("returns an unsubscribe function", () => {
        const unsubscribe = registry.observeStore(store, testItem);
        expect(unsubscribe()).toBeTruthy();
    });
});

describe("getAllSubReducers", () => {
    let anotherUid: string;
    let reducerMap: ReducersMapObject;
    let allUids: string[];

    const actionOne: ICoreAction = {
        type: "ACTION1",
        listener: testItemUid,
        payload: 23,
    };

    const actionTwo: ICoreAction = {
        type: "ACTION2",
        listener: testItemUid,
        payload: 42,
    };

    beforeEach(() => {
        const anotherItem = registry.add();
        anotherUid = anotherItem.uid;
        reducerMap = registry.getAllSubReducers();
        allUids = Object.keys(reducerMap);
    });

    test("returns a map that has one property for every uid", () => {
        expect(allUids).toHaveLength(2);
        expect(allUids).toContain(testItemUid);
        // expect(allUids).toContain(someOtherUid);
    });

    test("map entries contain reducers", () => {
        const oneState: IState = reducerMap[testItemUid](testState, actionOne);
        const anotherState: IState = reducerMap[anotherUid](testState, actionTwo);
        expect(oneState.ACTION1).toEqual(23);
        expect(anotherState.ACTION2).toEqual(42);
    });

    test("reducers don't mutate the state", () => {
        const nextState: IState = reducerMap[testItemUid](testState, actionOne);
        expect(nextState.ACTION1).toEqual(23);
        expect(testState.ACTION1).toEqual(5);
    });
});
