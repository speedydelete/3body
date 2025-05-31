
export type RadiationType = 'a' | 'b+' | 'b-' | 'y' | 'n' | '2n';

export interface IsotopeData {
    name?: string;
    mass: number;
    abundance?: number;
    decay?: [number, RadiationType];
}

export class Element {

    name: string;
    abbr: string;
    number: number;
    electronConfig: Map<string, number>;
    isotopes: Map<number, IsotopeData>;
    mass: number;

    constructor(name: string, abbr: string, number: number, electronConfig: Map<string, number>, isotopes: Map<number, IsotopeData>) {
        this.name = name;
        this.abbr = abbr;
        this.number = number;
        this.electronConfig = electronConfig;
        this.isotopes = isotopes;
        this.mass = 0;
        for (let isotope of isotopes.values()) {
            this.mass += isotope.mass * (isotope.abundance ?? 0);
        }
    }

}

const DAY = 86400;
const YEAR = DAY * 365;

export const H = new Element('Hydrogen', 'H', 1, new Map([
    ['1s', 1],
]), new Map([
    [1, {
        name: 'Protium',
        mass: 1.007825031898,
        abundance: 0.999855,
    }],
    [2, {
        name: 'Deuterium',
        mass: 2.014101777844,
        abundance: 0.000145,
    }],
    [3, {
        name: 'Tritium',
        mass: 3.016049281320,
        decay: [12.33 * YEAR, 'b-'],
    }]
]))


