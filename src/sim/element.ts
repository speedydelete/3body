
import RAW_ELEMENT_DATA from '../../data/elements.csv';
import RAW_ISOTOPE_DATA from '../../data/isotopes.csv';


export type SOrbital = '1s' | '2s' | '3s' | '4s' | '5s' | '6s' | '7s';
export type POrbital = '2p' | '3p' | '4p' | '5p' | '6p' | '7p';
export type DOrbital = '3d' | '4d' | '5d' | '6d';
export type FOrbital = '4f' | '5f';
export type Orbital = SOrbital | POrbital | DOrbital | FOrbital;

export type ElectronConfig = 
    | {[K in SOrbital]?: 1 | 2}
    | {[K in POrbital]?: 1 | 2 | 3 | 4 | 5 | 6}
    | {[K in DOrbital]?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}
    | {[K in FOrbital]?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14};

export type DecayType = 'a' | 'b-' | 'b+' | 'p' | 'n' | 'ec' | 'it' | 'sf';

export interface DecayMode {
    types: DecayType[];
    probability: number;
}

export interface Isotope {
    z: number;
    n: number;
    radius: number;
    mass: number;
    abundance: number;
    halfLife: number;
    decayModes: DecayMode[];
    energies: {
        alpha?: number;
        betaMinus?: number;
        neutron?: number;
        electronCapture?: number;
    };
}

export interface Element {
    name: string;
    symbol: string;
    number: number;
    mass: number;
    electronConfig: ElectronConfig;
    isotopes: Isotope[];
}


function parseElectronConfig(config: string): ElectronConfig {
    let out: ElectronConfig = {};
    for (let data of config.split(' ')) {
        if (data.startsWith('[')) {
            Object.assign(out, structuredClone(elements[data.slice(1, -1)].electronConfig));
        } else {
            let orbitalNum = parseInt(data);
            let index = orbitalNum.toString().length;
            let orbital = orbitalNum + data[index];
            let count = parseInt(data.slice(index + 1));
            // @ts-ignore
            out[orbital] = count;
        }
    }
    return out;
}

function parseSingleDecayType(type: string): [DecayType, number] | null {
    if ('APN'.includes(type[0])) {
        return [type[0].toLowerCase() as DecayType, 1];
    } else if (['B+', 'B-', 'EC', 'IT', 'SF'].includes(type.slice(0, 2))) {
        return [type.slice(0, 2).toLowerCase() as DecayType, 2];
    } else {
        return null;
    }
}

function parseDecayType(type: string): DecayType[] {
    let originalType = type;
    let out: DecayType[] = [];
    while (type.length > 0) {
        let singleType = parseSingleDecayType(type);
        if (singleType === null) {
            if ('0123456789'.includes(type[0])) {
                let num = parseInt(type);
                type = type.slice(num.toString().length);
                let singleType = parseSingleDecayType(type);
                if (singleType === null) {
                    throw new Error(`Invalid decay type: ${originalType}`);
                }
                type = type.slice(singleType[1]);
                for (let i = 0; i < num; i++) {
                    out.push(singleType[0]);
                }
            } else {
                throw new Error(`Invalid decay type: ${originalType}`);
            }
        } else {
            out.push(singleType[0]);
            type = type.slice(singleType[1]);
        }
    }
    return out;
}


export let isotopes: Isotope[] = [];

for (let i = 2; i < RAW_ISOTOPE_DATA.length; i++) {
    let data = RAW_ISOTOPE_DATA[i].split(',');
    let decayModes: DecayMode[] = [];
    for (let i = 8; i <= 12; i += 2) {
        if (data[i] !== '') {
            decayModes.push({
                types: parseDecayType(data[i]),
                probability: parseFloat(data[i + 1]),
            })
        }
    }
    let abundance = data[5] === '' ? 0 : parseFloat(data[5]);
    let halfLife: number;
    if (data[6] === 'null') {
        halfLife = NaN;
    } else if (data[6] === 'stable') {
        halfLife = Infinity;
    } else {
        halfLife = parseFloat(data[6]);
    }
    let energies: Isotope['energies'] = {};
    if (data[15] !== '') {
        energies.betaMinus = parseFloat(data[15]);
    }
    if (data[16] !== '') {
        energies.neutron = parseFloat(data[16]);
    }
    if (data[17] !== '') {
        energies.alpha = parseFloat(data[17]);
    }
    if (data[18] !== '') {
        energies.electronCapture = parseFloat(data[18]);
    }
    isotopes.push({
        z: parseInt(data[0]),
        n: parseInt(data[1]),
        radius: parseFloat(data[3]),
        mass: parseFloat(data[4]),
        abundance,
        halfLife,
        decayModes,
        energies,
    });
}


export let elements: {[key: string | number]: Element} = {};

for (let i = 1; i < RAW_ELEMENT_DATA.length; i++) {
    let data = RAW_ELEMENT_DATA[i].split(',');
    let eltIsotopes = isotopes.filter(x => x.z === i);
    let element: Element = {
        name: data[0],
        symbol: data[1],
        number: i,
        electronConfig: parseElectronConfig(data[3]),
        mass: eltIsotopes.map(x => x.abundance).reduce((x, y) => x + y),
        isotopes: eltIsotopes,
    };
    elements[i] = element;
    elements[element.name] = element;
    elements[element.name.toLowerCase()] = element;
    elements[element.symbol] = element;
}
