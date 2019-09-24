import { Action, createStore, Store } from "redux";

/**
 * The main reducer that's called by the store every time an action
 * gets dispatched. By default it just returns an empty state object
 * but will be hydrated with higher-order reducers at runtime as plugins
 * get loaded.
 * @param state The state object. If undefined, an empty object will be assigned
 * @param action An action object that alters the state
 */
export function rootReducer(state = {}, action: Action) {
    return state;
}

/**
 * The store is empty and there are no reducers at startup.
 * Reducers will be attached as plugin instances are added.
 * That's why we use an enhanced "createStore" function to
 * attach reducers dynamically.
 *
 * In the future this could be done without an external
 * library. See:
 * https://tylergaw.com/articles/dynamic-redux-reducers/
 */
export const store: Store = createStore(rootReducer);