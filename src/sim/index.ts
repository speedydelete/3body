
import './element.js';


export const G = 6.67430e-11;
export const SBC = 5.670374419e-8;

export const SM = 1.9885e30;
export const SR = 695700000;
export const SL = 3.486e26;


export class Vector3 {

    x: number;
    y: number;
    z: number;

    constructor(x: number | ArrayBuffer = 0, y: number = 0, z: number = 0) {
        if (x instanceof ArrayBuffer) {
            let view = new DataView(x);
            this.x = view.getFloat64(0);
            this.y = view.getFloat64(4);
            this.z = view.getFloat64(8);
        } else {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    get [0](): number {
        return this.x;
    }

    get [1](): number {
        return this.y;
    }

    get [2](): number {
        return this.z;
    }

    set [0](value: number) {
        this.x = value;
    }

    set [1](value: number) {
        this.x = value;
    }

    set [2](value: number) {
        this.x = value;
    }

    toString(): string {
        return `${this.x}, ${this.y}, ${this.z}`;
    }

    [Symbol.iterator](): ArrayIterator<number> {
        return [this.x, this.y, this.z][Symbol.iterator]();
    }

    export(buffer?: ArrayBuffer): ArrayBuffer {
        buffer ??= new ArrayBuffer(12);
        let view = new DataView(buffer);
        view.setFloat64(0, this.x);
        view.setFloat64(4, this.y);
        view.setFloat64(8, this.z);
        return buffer;
    }

    copy(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    add(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            this.x += other;
            this.y += other;
            this.z += other;
        } else {
            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
        }
        return this;
    }

    sub(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            this.x -= other;
            this.y -= other;
            this.z -= other;
        } else {
            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;
        }
        return this;
    }

    mul(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            this.x *= other;
            this.y *= other;
            this.z *= other;
        } else {
            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;
        }
        return this;
    }

    div(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            this.x /= other;
            this.y /= other;
            this.z /= other;
        } else {
            this.x /= other.x;
            this.y /= other.y;
            this.z /= other.z;
        }
        return this;
    }

    abs(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    distanceTo(other: Vector3): number {
        return this.copy().sub(other).abs();
    }

}


export interface ObjParams {
    position: Vector3;
    velocity: Vector3;
    mass: number;
    radius: number;
}

export class BaseObj {

    static readonly SIZE: number = 45;

    position: Vector3;
    velocity: Vector3;
    mass: number;
    radius: number;

    constructor(options: ObjParams) {
        this.position = options.position;
        this.velocity = options.velocity;
        this.mass = options.mass;
        this.radius = options.radius;
    }

    distanceTo(other: BaseObj): number {
        return this.position.distanceTo(other.position);
    }

    relativeVelocity(other: BaseObj): Vector3 {
        return this.velocity.copy().sub(other.velocity);
    }

}


function clamp(value: number): number {
    return Math.round(value < 0 ? 0 : (value > 255 ? 255 : value));
}

export class Star extends BaseObj {

    get luminosity(): number {
        let mass = this.mass / SM;
        if (mass < 0.43) {
            mass **= 2.3;
        } else if (mass < 2) {
            mass **= 4;
        } else {
            mass **= 3.5;
        }
        return SL * mass;
    }

    get temperature(): number {
        return (this.luminosity / (4 * Math.PI * this.radius**2 * SBC))**(1/4);
    }

    get color(): number {
        // https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
        let x = this.temperature / 100;
        let r: number;
        let g: number, b: number;
        if (x < 66) {
            r = 255;
            g = clamp(99.4708025861 * Math.log(x) - 161.1195681661);
            b = x <= 19 ? 0 : clamp(138.5177312231 * Math.log(x - 10) - 305.0447927307);
        } else {
            r = clamp(329.698727446 * (x - 60) ** -0.1332047592);
            g = clamp(288.1221695283 * (x - 60) ** -0.0755148492);
            b = 255;
        }
        g = clamp((g / 241) * 255);
        b = clamp((b / 224) * 255);
        return (r << 16) | (g << 8) | b;
    }

}


export interface PlanetParams extends ObjParams {
    texture: string;
    albedo: number;
}

export class Planet extends BaseObj {

    texture: string;
    albedo: number;

    constructor(params: PlanetParams) {
        super(params);
        this.texture = params.texture;
        this.albedo = params.albedo;
    }

}


export type Obj = Star | Planet;


export class Simulation {

    time: number = 0;
    timeWarp: number = 1;
    objs: Obj[];

    constructor(...objs: Obj[]) {
        this.objs = objs;
    }

    update(dt: number): void {
        dt *= this.timeWarp;
        this.time += dt;
        let forces = Array.from({length: this.objs.length}, () => new Vector3());
        for (let i = 0; i < this.objs.length; i++) {
            let obj = this.objs[i];
            for (let j = 0; j < this.objs.length; j++) {
                if (i === j) continue;
                let other = this.objs[j];
                let diff = other.position.copy().sub(obj.position);
                let distSq = diff.x ** 2 + diff.y ** 2 + diff.z ** 2;
                if (distSq === 0) continue;
                let distance = Math.sqrt(distSq);
                let forceMagnitude = G * obj.mass * other.mass / distSq;
                let forceDirection = diff.div(distance);
                let force = forceDirection.mul(forceMagnitude);

                forces[i].add(force);
            }
        }
        for (let i = 0; i < this.objs.length; i++) {
            let obj = this.objs[i];
            let acceleration = forces[i].copy().div(obj.mass);
            obj.velocity.add(acceleration.copy().mul(dt));

            obj.position.add(obj.velocity.copy().mul(dt));
        }
    }

    getTemperatureOf(obj: Obj): number {
        if (obj instanceof Star) {
            return obj.temperature;
        } else {
            let S = 0;
            for (let other of this.objs) {
                if (other instanceof Star) {
                    S += other.luminosity / (4 * Math.PI * obj.distanceTo(other)**2);
                }
            }
            return ((1 - obj.albedo) * S / (4 * SBC)) ** (1/4);
        }
    }

}
