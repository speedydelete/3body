
export type SOrbital = '1s' | '2s' | '3s' | '4s' | '5s' | '6s' | '7s';
export type POrbital = '2p' | '3p' | '4p' | '5p' | '6p' | '7p';
export type DOrbital = '3d' | '4d' | '5d' | '6d';
export type FOrbital = '4f' | '5f';
export type Orbital = SOrbital | POrbital | DOrbital | FOrbital;

export type ElectronConfig = {[K in SOrbital]?: 1 | 2} | {[K in POrbital]: 1 | 2 | 3 | 4 | 5 | 6} | {[K in DOrbital]: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} | {[K in FOrbital]: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14};

export type RadiationType = 'a' | 'b+' | 'b-' | 'y' | 'n' | '2n';

export type DecayMode = [RadiationType, number]

export interface StableIsotopeData {
    name?: string;
    mass: number;
    abundance?: number;
}

export interface UnstableIsotopeData extends StableIsotopeData {
    halfLife: number;
    decayModes: DecayMode[];
}

export type IsotopeData = StableIsotopeData | UnstableIsotopeData;


export class Element {

    name: string;
    abbr: string;
    number: number;
    electronConfig: ElectronConfig;
    isotopes: {[key: number]: IsotopeData};
    mass: number;

    constructor(name: string, abbr: string, number: number, electronConfig: ElectronConfig, isotopes: {[key: number]: IsotopeData}, mass: number) {
        this.name = name;
        this.abbr = abbr;
        this.number = number;
        this.electronConfig = electronConfig;
        this.isotopes = isotopes;
        this.mass = mass;
        for (let isotope of Object.values(isotopes)) {
            this.mass += isotope.mass * (isotope.abundance ?? 0);
        }
    }

}


export type NobleGas = 'He' | 'Ne' | 'Ar' | 'Kr' | 'Xe' | 'Rn';
type SOrbitalWithCount = `${SOrbital}${1 | 2}`;
type POrbitalWithCount = `${POrbital}${1 | 2 | 3 | 4 | 5 | 6}`;
type DOrbitalWithCount = `${DOrbital}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;
type FOrbitalWithCount = `${FOrbital}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14}`;
type OrbitalWithCount = SOrbitalWithCount | POrbitalWithCount | DOrbitalWithCount | FOrbitalWithCount;
type ValidSimpleConfig<T extends string> = T extends `${OrbitalWithCount}` ? T : (T extends `${infer First extends OrbitalWithCount} ${infer Rest}` ? `${First} ${ValidSimpleConfig<Rest>}` : never);
type ValidElectronConfig<T extends string> = T extends `[${infer Gas extends NobleGas}] ${infer Rest}` ? `[${Gas}] ${ValidSimpleConfig<Rest>}` : ValidSimpleConfig<T>;

declare function element<T extends string>(name: string, abbr: string, number: number, config: ValidElectronConfig<T>, isotopes: {[key: number]: [mass: number, abundance?: number] | [name: string, mass: number, abundance?: number] | [mass: number, halfLife: number, decayModes: DecayMode[], abundance?: number] | [name: string, mass: number, halfLife: number, decayModes: DecayMode[], abundance?: number]}): Element;

const DAY = 86400;
const YEAR = DAY * 365;


const _elements = [

    element('Hydrogen', 'H', 1, '1s1', {
        1: ['Protium', 1.007825031898, 0.999855],
        2: ['Deuterium', 2.014101777844, 0.000145],
        3: ['Tritium', 3.016049281320, 12.33 * YEAR, [['b-', 18590]]],
    }),

    element('Helium', 'He', 2, '1s2', {
        3: [3.016029321967, 0.000002],
        4: [4.002603254130, 0.999998],
    }),

    element('Lithium', 'Li', 3, '[He] 2s1', {
        6: [6.0151228874, 0.0485],
        7: [7.016003434, 0.9515],
    }),

    element('Beryllium', 'Be', 4, '[He] 2s2', {
        8: [9.01218306, 1],
    }),

    element('Boron', 'B', 5, '[He] 2s2 2p1', {
        10: [10.012936862, 0.1965],
        11: [11.009305167, 0.8035],
    }),

    element('Carbon', 'C', 6, '[He] 2s2 2p2', {
        12: [12, 0.9894],
        13: [13.003354835336, 0.0106],
        14: [14.003241989, 5.70e3 * YEAR, [['b-', 0.156476]]],
    }),

    element('Nitrogen', 'N', 7, '[He] 2s2 2p3', {
        14: [14.003074004251, 0.996205],
        15: [15.000108898266, 0.003795],
    }),

    element('Oxygen', 'O', 8, '[He] 2s2 2p4', {
        16: [15.994914619257, 0.99757],
        17: [16.999131755953, 0.0003835],
        18: [17.999159612136, 0.002045],
    }),

    element('Fluorine', 'F', 9, '[He] 2s2 2p5', {
        19: [18.998403162067, 1],
    }),

    element('Neon', 'Ne', 10, '[He] 2s2 2p6', {
        20: [19.9924401753, 0.9048],
        21: [20.99384669, 0.0027],
        22: [21.991385114, 0.0925],
    }),

    element('Sodium', 'Na', 11, '[Ne] 3s1', {
        23: [22.9897692820, 1],
    }),

    element('Magnesium', 'Mg', 12, '[Ne] 3s2', {}),

    element('Aluminum', 'Al', 13, '[Ne] 3s2 3p1', {}),

    element('Silicon', 'Si', 14, '[Ne] 3s2 3p2', {}),

    element('Phosphorus', 'P', 15, '[Ne] 3s2 3p3', {}),

    element('Sulfur', 'S', 16, '[Ne] 3s2 3p4', {}),

    element('Chlorine', 'Cl', 17, '[Ne] 3s2 3p5', {}),

    element('Argon', 'Ar', 18, '[Ne] 3s2 3p6', {}),

    element('Potassium', 'K', 19, '[Ar] 4s1', {}),

    element('Calcium', 'Ca', 20, '[Ar] 4s2', {}),

    element('Scandium', 'Sc', 21, '[Ar] 3d1 4s2', {}),

    element('Titanium', 'Ti', 22, '[Ar] 3d2 4s2', {}),

    element('Vanadium', 'V', 23, '[Ar] 3d3 4s2', {}),

    element('Chromium', 'Cr', 24, '[Ar] 3d5 4s1', {}),

    element('Manganese', 'Mn', 25, '[Ar] 3d5 4s2', {}),

    element('Iron', 'Fe', 26, '[Ar] 3d6 4s2', {}),

    element('Cobalt', 'Co', 27, '[Ar] 3d7 4s2', {}),

    element('Nickel', 'Ni', 28, '[Ar] 3d8 4s2', {}),

    element('Copper', 'Cu', 29, '[Ar] 3d10 4s1', {}),

    element('Zinc', 'Zn', 30, '[Ar] 3d10 4s2', {}),

    element('Gallium', 'Ga', 31, '[Ar] 3d10 4s2 4p1', {}),

    element('Germanium', 'Ge', 32, '[Ar] 3d10 4s2 4p2', {}),

    element('Arsenic', 'As', 33, '[Ar] 3d10 4s2 4p3', {}),

    element('Selenium', 'Se', 34, '[Ar] 3d10 4s2 4p4', {}),

    element('Bromine', 'Br', 35, '[Ar] 3d10 4s2 4p5', {}),

    element('Krypton', 'Kr', 36, '[Ar] 3d10 4s2 4p6', {}),

    element('Rubidium', 'Rb', 37, '[Kr] 5s1', {}),

    element('Strontium', 'Sr', 38, '[Kr] 5s2', {}),

    element('Yttrium', 'Y', 39, '[Kr] 4d1 5s2', {}),

    element('Zirconium', 'Zr', 40, '[Kr] 4d2 5s2', {}),

    element('Niobium', 'Nb', 41, '[Kr] 4d4 5s1', {}),

    element('Molybdenum', 'Mo', 42, '[Kr] 4d5 5s1', {}),

    element('Technetium', 'Tc', 43, '[Kr] 4d5 5s2', {}),

    element('Ruthenium', 'Ru', 44, '[Kr] 4d7 5s1', {}),

    element('Rhodium', 'Rh', 45, '[Kr] 4d8 5s1', {}),

    element('Palladium', 'Pd', 46, '[Kr] 4d10', {}),

    element('Silver', 'Ag', 47, '[Kr] 4d10 5s1', {}),

    element('Cadmium', 'Cd', 48, '[Kr] 4d10 5s2', {}),

    element('Indium', 'In', 49, '[Kr] 4d10 5s2 5p1', {}),

    element('Tin', 'Sn', 50, '[Kr] 4d10 5s2 5p2', {}),

    element('Antimony', 'Sb', 51, '[Kr] 4d10 5s2 5p3', {}),

    element('Tellurium', 'Te', 52, '[Kr] 4d10 5s2 5p4', {}),

    element('Iodine', 'I', 53, '[Kr] 4d10 5s2 5p5', {}),

    element('Xenon', 'Xe', 54, '[Kr] 4d10 5s2 5p6', {}),

    element('Cesium', 'Cs', 55, '[Xe] 6s1', {}),

    element('Barium', 'Ba', 56, '[Xe] 6s2', {}),

    element('Lanthanum', 'La', 57, '[Xe] 5d1 6s2', {}),

    element('Cerium', 'Ce', 58, '[Xe] 4f1 5d1 6s2', {}),

    element('Praseodymium', 'Pr', 59, '[Xe] 4f3 6s2', {}),

    element('Neodymium', 'Nd', 60, '[Xe] 4f4 6s2', {}),

    element('Promethium', 'Pm', 61, '[Xe] 4f5 6s2', {}),

    element('Samarium', 'Sm', 62, '[Xe] 4f6 6s2', {}),

    element('Europium', 'Eu', 63, '[Xe] 4f7 6s2', {}),

    element('Gadolinium', 'Gd', 64, '[Xe] 4f7 5d1 6s2', {}),

    element('Terbium', 'Tb', 65, '[Xe] 4f9 6s2', {}),

    element('Dysprosium', 'Dy', 66, '[Xe] 4f10 6s2', {}),

    element('Holmium', 'Ho', 67, '[Xe] 4f11 6s2', {}),

    element('Erbium', 'Er', 68, '[Xe] 4f12 6s2', {}),

    element('Thulium', 'Tm', 69, '[Xe] 4f13 6s2', {}),

    element('Ytterbium', 'Yb', 70, '[Xe] 4f14 6s2', {}),

    element('Lutetium', 'Lu', 71, '[Xe] 4f14 5d1 6s2', {}),

    element('Hafnium', 'Hf', 72, '[Xe] 4f14 5d2 6s2', {}),

    element('Tantalum', 'Ta', 73, '[Xe] 4f14 5d3 6s2', {}),

    element('Tungsten', 'W', 74, '[Xe] 4f14 5d4 6s2', {}),

    element('Rhenium', 'Re', 75, '[Xe] 4f14 5d5 6s2', {}),

    element('Osmium', 'Os', 76, '[Xe] 4f14 5d6 6s2', {}),

    element('Iridium', 'Ir', 77, '[Xe] 4f14 5d7 6s2', {}),

    element('Platinum', 'Pt', 78, '[Xe] 4f14 5d9 6s1', {}),

    element('Gold', 'Au', 79, '[Xe] 4f14 5d10 6s1', {}),

    element('Mercury', 'Hg', 80, '[Xe] 4f14 5d10 6s2', {}),

    element('Thallium', 'Tl', 81, '[Xe] 4f14 5d10 6s2 6p1', {}),

    element('Lead', 'Pb', 82, '[Xe] 4f14 5d10 6s2 6p2', {}),

    element('Bismuth', 'Bi', 83, '[Xe] 4f14 5d10 6s2 6p3', {}),

    element('Polonium', 'Po', 84, '[Xe] 4f14 5d10 6s2 6p4', {}),

    element('Astatine', 'At', 85, '[Xe] 4f14 5d10 6s2 6p5', {}),

    element('Radon', 'Rn', 86, '[Xe] 4f14 5d10 6s2 6p6', {}),

    element('Francium', 'Fr', 87, '[Rn] 7s1', {}),

    element('Radium', 'Ra', 88, '[Rn] 7s2', {}),

    element('Actinium', 'Ac', 89, '[Rn] 6d1 7s2', {}),

    element('Thorium', 'Th', 90, '[Rn] 6d2 7s2', {}),

    element('Protactinium', 'Pa', 91, '[Rn] 5f2 6d1 7s2', {}),

    element('Uranium', 'U', 92, '[Rn] 5f3 6d1 7s2', {}),

];

export const elements: {[key: string | number]: Element} = Object.fromEntries(_elements.flatMap(e => [[e.number, e], [e.name, e], [e.abbr, e]]));
