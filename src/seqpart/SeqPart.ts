import { ActionCreatorsMapObject } from "redux";
import { Tuple } from "../interfaces/interfaces";
import { IOscActionDef, OscArgSequence } from "../interfaces/IActions";
import { ISeqPart, ISeqPartInitState } from "../interfaces/IRegistryItems";
import { actionDefs } from "./SeqPartActionDefs";

type Pattern = OscArgSequence[][];

interface IPointerTable {
    [pointerId: string]: number;
}

/**
 * Represents a part of a sequence. It can be
 * used in many ways:
 *
 * * A part of a track like in piano-roll sequencers
 * * A pattern like in step sequencers, drum computers and trackers
 * * A loop like in live sequencers
 *
 * Technically it can store any type of event your system is capable of.
 * This means it is not limited to audio, midi, osc or dmx but can hold
 * any type of javascript object. However it is strongly recommended
 * to only use actions of type IOscAction.
 */
export default class SeqPart implements ISeqPart {
    public static stepsPerBarDefault = 16; // global pattern resolution: 1bar = 1 full note

    public readonly actionDefs: IOscActionDef[] = actionDefs;
    public readonly initState: ISeqPartInitState;

    /* will both be populated by the registry */
    public actionCreators: ActionCreatorsMapObject = {};
    public unboundActionCreators: ActionCreatorsMapObject = {};

    private stepMultiplier: number; // 64 = stepsPerBar * stepMultiplier
    private pattern: Pattern; // holds the sequence

    /**
     * Initializes the pattern
     * @param uid           unique identifier of this part
     * @param patternLength length of the pattern in stepsPerBar
     * @param stepsPerBar   pattern resolution: 1bar = 1 full note
     */
    constructor(
        readonly uid: string,
        private patternLength = SeqPart.stepsPerBarDefault,
        public stepsPerBar = SeqPart.stepsPerBarDefault
    ) {
        if (64 % stepsPerBar === 0) {
            this.stepMultiplier = 64 / stepsPerBar;
            this.pattern = this.initPattern(this.patternLength);
        } else {
            throw new Error("stepsPerBar must be a divisor of 64.");
        }

        this.initState = {
            stepsPerBar: this.stepsPerBar,
            stepMultiplier: this.stepMultiplier,
            pattern: this.pattern,
        };
    }

    /**
     * Unsubscribe from the dispatcher.
     * This is empty by default and will
     * be overridden by the registry.
     */
    public unsubscribe(): void {
        // will be overridden by the registry
    }

    /**
     * The actual array structure of the part.
     * You should use higher order API unless you
     * know exactly what you're doing.
     */
    public get seqPattern(): Pattern {
        return this.pattern;
    }

    /**
     * Get the length of the pattern in stepsPerBar
     */
    public get length(): number {
        // return this.pattern.length / this.stepMultiplier;
        return this.pattern.length;
    }

    public onChange(changed: Tuple): boolean {
        switch (changed[0]) {
            case "ADD_ACTION":
                const addStep: number = changed[1].step;
                const addAction: OscArgSequence = changed[1].action;
                // write test with step<0 and addAction=undefined
                if (addStep >= 0 && addAction) {
                    this.addEvent(addAction, addStep);
                }
                return true;
            case "REMOVE_ACTION":
                const removeStep: number = changed[1].step;
                const removeAction: OscArgSequence = changed[1].action;
                this.removeEvent(removeAction, removeStep);
                return true;
            default:
                return false;
        }
    }

    /**
     * Adds an event to the pattern at a given position
     * @param  event  The event (note, controller, whatever)
     * @param  step  Position in the pattern
     * @return The part object to make the function chainable.
     */
    public addEvent(event: OscArgSequence, step: number): SeqPart {
        const maxStepValue = this.pattern.length / this.stepMultiplier - 1;
        if (step <= maxStepValue) {
            const pos = step * this.stepMultiplier;
            this.pattern[pos].push(event);
        }
        return this;
    }

    /**
     * Removes an event at a given position
     * @param  event  The event (note, controller, whatever)
     * @param  step  Position in the pattern
     * @return The part object to make the function chainable
     */
    public removeEvent(event: OscArgSequence, step: number): SeqPart {
        const pos = step * this.stepMultiplier;
        const index = this.pattern[pos].indexOf(event);
        if (index >= 0) {
            this.pattern[pos].splice(index, 1);
        }
        return this;
    }

    /**
     * Get all positions that contain at least one note.
     * Can be handy to draw events on the screen.
     * @example <caption>from {@tutorial Stepsequencer}</caption>
     * bdSteps = bdPart.getNotePositions();
     * bdSteps.forEach(function(pos) {
     *   document.getElementById('bd' + pos).style.backgroundColor = 'red';
     * });
     * @return List with all non-empty pattern entries
     */
    // public getNotePositions(): number[] {
    //     const positions: number[] = [];
    //     this.pattern.forEach((actions, index) => {
    //         if (actions.length > 0) {
    //             actions.forEach((action) => {
    //                 if (action.type === "NOTE") {
    //                     positions.push(index / this.stepMultiplier);
    //                 }
    //             });
    //         }
    //     });
    //     return positions;
    // }

    public getActionsAtStep(step: number): OscArgSequence[] {
        let actions: OscArgSequence[] = [];
        const position = step * this.stepMultiplier;

        if (position < this.pattern.length) {
            actions = this.pattern[position];
        }
        return actions;
    }

    // This is very close to getActionsAtStep and
    // can probably be simplified.
    // public getActionsAtPointerPosition(pointerId: string): IAction[] {
    //     let actionsAtPointerPosition: IAction[] = [];

    //     if (this.pointers.hasOwnProperty(pointerId)) {
    //         const pointer = this.pointers[pointerId];

    //         if (pointer < this.pattern.length) {
    //             actionsAtPointerPosition = this.pattern[pointer];
    //         }
    //     }

    //     return actionsAtPointerPosition;
    // }

    /**
     * Extends a part at the top/start.
     * @param  extLength Length in stepsPerBar
     */
    public extendOnTop(extLength: number): void {
        const extension = this.initPattern(extLength);
        this.pattern = [...extension, ...this.pattern];
    }

    /**
     * Extends a part at the end
     * @param  extLength Length in stepsPerBar
     */
    public extendOnEnd(extLength: number): void {
        const extension = this.initPattern(extLength);
        this.pattern = this.pattern.concat(extension);
    }

    /**
     * Initialize an empty pattern for the part.
     * @param  lengthInStepsPerBar  Length of the pattern
     */
    private initPattern(lengthInStepsPerBar: number): Pattern {
        const pattern: Pattern = [];
        const patternLength = lengthInStepsPerBar * this.stepMultiplier;
        for (let i = 0; i < patternLength; i++) {
            pattern[i] = [];
        }
        return pattern;
    }
}
