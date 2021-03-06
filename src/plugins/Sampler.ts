import { AbstractPlugin } from "../registry/AbstractPlugin";
import { Tuple, IntermixNote } from "../interfaces/interfaces";
import { IOscActionDef } from "../interfaces/IActions";
import { IPlugin, IPluginConstructor } from "../interfaces/IRegistryItems";

const Plugin: IPluginConstructor = class Sampler extends AbstractPlugin implements IPlugin {
    public static readonly METADATA = {
        type: "instrument",
        name: "Intermix Sampler",
        version: "1.0.0",
        authors: "R. Jansen",
        desc: "A sample player",
    };
    private static readonly PREFIX = "/intermix/plugin/<UID>/";

    public readonly actionDefs: IOscActionDef[] = [
        {
            address: Sampler.PREFIX + "audioData",
            typeTag: ",b",
        },
    ];

    // private myState: IState = {};
    private gainNode: GainNode;
    private audioData: AudioBuffer;
    private queue: AudioBufferSourceNode[] = []; // list of polyphonic voices

    constructor(public readonly uid: string, private ac: AudioContext) {
        super();

        // create gain node
        this.gainNode = this.ac.createGain();
        this.gainNode.gain.value = 1;

        // create an empty audio buffer to prevent potential errors
        this.audioData = ac.createBuffer(1, 1, ac.sampleRate);
    }

    // list of all audio output nodes
    public get outputs(): AudioNode[] {
        return [this.gainNode];
    }

    // list of all input nodes, if no inputs, return an empty list
    public get inputs(): AudioNode[] {
        return [];
    }

    // onChange gets called
    // on every state change
    public onChange(changed: Tuple): boolean {
        switch (changed[0]) {
            case "note":
                const note: IntermixNote = changed[1];
                this.handleNote(note);
                return true;
            case "volume":
                this.handleVolume(changed[1]);
                return true;
            case "stop":
                this.stop();
                return true;
            case "audioData":
                const buffer: AudioBuffer = changed[1];
                this.handleAudioData(buffer);
                return true;
            default:
                return false;
        }
    }

    private handleNote(note: IntermixNote): void {
        if (note[1] >= 0 && note[1] <= 127) {
            this.start(note);
        }
    }

    private handleVolume(volume: number): void {
        if (volume >= 0 && volume <= 127) {
            this.gainNode.gain.value = volume / 128;
        }
    }

    private handleAudioData(buffer: AudioBuffer): void {
        this.audioData = buffer;
    }

    /**
     * Starts a sound (AudioBufferSourceNode) and stores a references
     * in a queue. This enables you to play multiple sounds at once
     * and even stop them all at a given time.
     */
    private start(note: IntermixNote): void {
        // const frequency = this.frequencyLookup[note.value];
        const playbackRate = this.getPlaybackRate(note[1]);

        const bufferSrcNode = this.createBufferSrcNode();

        bufferSrcNode.playbackRate.value = playbackRate;
        bufferSrcNode.connect(this.gainNode);

        this.queue.push(bufferSrcNode);
        bufferSrcNode.start(note[4]);
    }

    /**
     * Stops all audio stream, even the ones that are just scheduled.
     * It also cleans the queue so that the sound object is ready for another round.
     */
    private stop(): void {
        this.queue.forEach((node) => {
            node.stop();
            node.disconnect();
        });
        this.queue = []; // release all references
    }

    /**
     * Creates and configures a BufferSourceNode
     * that can be played once and then destroys itself.
     */
    private createBufferSrcNode(): AudioBufferSourceNode {
        const bufferSrc: AudioBufferSourceNode = this.ac.createBufferSource();
        bufferSrc.buffer = this.audioData;
        bufferSrc.onended = (): void => {
            this.destroyBufferSrcNode(bufferSrc);
        };

        return bufferSrc;
    }

    /**
     * This is not really note-acurate at the moment,
     * it just computes a value between 0-2 (1=default playback rate)
     * See: AudioBufferSourceNode.playbackRate at MDN
     * @param noteValue midi note number (0-127)
     */
    private getPlaybackRate(noteValue: number): number {
        const normalized = (noteValue - 64) / 64;
        const normalizedShifted = normalized + 1;
        return normalizedShifted;
    }

    /**
     * Destroyes a given AudioBufferSourceNode and deletes it
     * from the sourceNode queue. This is used in the onended
     * callback of all BufferSourceNodes to avoid dead references.
     */
    private destroyBufferSrcNode(bufferSrc: AudioBufferSourceNode): void {
        bufferSrc.disconnect();

        this.queue.forEach((node, index) => {
            if (bufferSrc === node) {
                this.queue.splice(index, 1);
            }
        });
    }
};
export default Plugin;
