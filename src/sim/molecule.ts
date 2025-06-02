
import {Element, elements as elementTable} from './element.js';


export interface MoleculeProperties {
    density: number;
    boilingPoint: number;
    meltingPoint: number;
    tripleTemperature?: number;
    triplePressure?: number;
    criticalTemperature?: number;
    criticalPressure?: number;
}

export class Molecule {

    id: string;
    name: string;
    elements: Map<Element, number>;
    density: number;
    boilingPoint: number;
    meltingPoint: number;
    tripleTemperature?: number;
    triplePressure?: number;
    criticalTemperature?: number;
    criticalPressure?: number;

    constructor(id: string, name: string, elements: Map<Element, number> | string, options: MoleculeProperties) {
        this.id = id;
        this.name = name;
        molecules.set(id, this);
        if (typeof elements === 'string') {
            this.elements = new Map();
            let element = '';
            let num = 0;
            let numSize = 0;
            for (let i = 0; i < elements.length; i++) {
                let char = elements[i];
                if ('0123456789'.includes(char)) {
                    num = Number(char) * 10**numSize;
                    numSize++;
                } else if (num !== 0) {
                    this.elements.set(elementTable[element], num);
                    element = '';
                    num = 0;
                } else {
                    element += char;
                }
            }
        } else {
            this.elements = elements;
        }
        this.density = options.density;
        this.meltingPoint = options.meltingPoint;
        this.boilingPoint = options.boilingPoint;
        this.tripleTemperature = options.tripleTemperature;
        this.triplePressure = options.triplePressure;
    }

}


export let molecules = new Map<string, Molecule>();


// @ts-ignore
const RAW_MOLECULE_DATA = (await import('./molecules.csv')).default as string;
