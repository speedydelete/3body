
const G = 6.67430e-11;
const SBC = 5.670374419e-8;


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
    isStar?: boolean;
    mass: number;
    radius: number;
    color: number;
    temperature: number;
}

export class Obj {

    static readonly SIZE: number = 41;

    position: Vector3;
    velocity: Vector3;
    isStar: boolean;
    mass: number;
    radius: number;
    color: number;
    temperature: number;

    constructor(options: ObjParams | ArrayBuffer) {
        if (options instanceof ArrayBuffer) {
            this.position = new Vector3(options);
            this.velocity = new Vector3(options.slice(12));
            let view = new DataView(options);
            this.isStar = Boolean(view.getUint8(24));
            this.mass = view.getFloat64(25);
            this.radius = view.getFloat64(29);
            this.color = view.getFloat64(33);
            this.temperature = view.getFloat64(37);
        } else {
            this.position = options.position;
            this.velocity = options.velocity;
            this.isStar = options.isStar ?? false;
            this.mass = options.mass;
            this.radius = options.radius;
            this.color = options.color;
            this.temperature = options.temperature;
        }
    }

    export(buffer?: ArrayBuffer): ArrayBuffer {
        buffer ??= new ArrayBuffer(Obj.SIZE);
        this.position.export(buffer);
        this.velocity.export(buffer.slice(12));
        let view = new DataView(buffer);
        view.setUint8(24, Number(this.isStar));
        view.setFloat64(25, this.mass);
        view.setFloat64(29, this.radius);
        view.setFloat64(33, this.color);
        view.setFloat64(37, this.temperature);
        return buffer;
    }
    
    get luminosity(): number {
        return SBC * (4 * Math.PI * this.radius**2) * this.temperature**4;
    }

    distanceTo(other: Obj): number {
        return this.position.distanceTo(other.position);
    }

    relativeVelocity(other: Obj): Vector3 {
        return this.velocity.copy().sub(other.velocity);
    }

}


export class Simulation {

    time: number = 0;
    timeWarp: number = 1;
    objs: Obj[] = [];

    constructor();
    constructor(data: ArrayBuffer);
    constructor(...objs: Obj[])
    constructor(data?: ArrayBuffer | Obj, ...objs: Obj[]) {
        if (data) {
            if (data instanceof ArrayBuffer) {
                let view = new DataView(data);
                this.time = view.getFloat64(0);
                for (let index = 4; index < data.byteLength; index += Obj.SIZE) {
                    this.objs.push(new Obj(data.slice(index)));
                }
            } else {
                this.objs.push(data, ...objs);
            }
        }
    }

    export(): ArrayBuffer {
        let buffer = new ArrayBuffer(4 + this.objs.length * Obj.SIZE);
        let view = new DataView(buffer);
        view.setFloat64(0, this.time);
        let index = 4;
        for (let obj of this.objs) {
            obj.export(buffer.slice(index));
            index += Obj.SIZE;
        }
        return buffer;
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

}
