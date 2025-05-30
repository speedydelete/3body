
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {Vector3, Obj, Simulation} from './simulation.js';


function query<T extends HTMLElement>(query: string): T {
    let elt = document.querySelector(query);
    if (!elt) {
        throw new Error(`Missing query: ${query}`);
    }
    return elt as T;
}


const AU = 149597870700;
const LY = 9.461e15;
const SM = 1.9885e30;
const SR = 695700000;
const FLYING_STAR_DISTANCE = AU * 4;

function randomDistance(scale: number): number {
    return Math.random() * scale - (scale / 2);
}

function randomPositionVector(): Vector3 {
    let scale = Math.random() * (Math.random() * (Math.random() * 50)) * AU;
    return new Vector3(randomDistance(scale), randomDistance(scale), randomDistance(scale));
}

function randomSpeed(): number {
    return Math.random() * 60000 - 30000;
}

function randomVelocityVector(): Vector3 {
    return new Vector3(randomSpeed(), randomSpeed(), randomSpeed());
}

function createSimulation(): [Simulation, {trisolaris: Obj, sun1: Obj, sun2: Obj, sun3: Obj}] {
    let trisolaris = new Obj({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        mass: 5.972168e24,
        radius: 6371000,
        color: 0xffffff,
        temperature: 0,
    });
    let sun1 = new Obj({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        isStar: true,
        mass: SM * 1.25,
        radius: SR * 1.359,
        color: 0xf4f1ff,
        temperature: 6350,
    });
    let sun2 = new Obj({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        isStar: true,
        mass: SM * 1.13,
        radius: SR * 1.167,
        color: 0xfff7fc,
        temperature: 6050,
    });
    let sun3 = new Obj({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        isStar: true,
        mass: SM * 0.9,
        radius: SR * 0.853,
        color: 0xffefdd,
        temperature: 5380,
    });
    return [new Simulation(trisolaris, sun1, sun2, sun3), {trisolaris, sun1, sun2, sun3}];
}


let settings = {
    fov: 70,
    unitSize: 1000000000,
    cameraMinDistance: 0.0000001,
    cameraMaxDistance: AU * 100,
    controlsMinDistance: 0.00001,
    controlsMaxDistance: Number.MAX_SAFE_INTEGER,
};

let [sim, {trisolaris, sun1, sun2, sun3}] = createSimulation();

const unitSize = settings.unitSize;

let renderer = new three.WebGLRenderer({
    canvas: query<HTMLCanvasElement>('canvas'),
    precision: 'highp',
    alpha: true,
    logarithmicDepthBuffer: true,
});
renderer.toneMapping = three.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.setSize(window.innerWidth, window.innerHeight - 40);

let camera = new three.PerspectiveCamera(settings.fov, window.innerWidth/window.innerHeight, settings.cameraMinDistance/unitSize, settings.cameraMaxDistance/unitSize);

let controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = settings.controlsMinDistance/unitSize;
controls.maxDistance = settings.controlsMaxDistance/unitSize;
controls.keys = {LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown'}
controls.keyPanSpeed = 2;
controls.update();
controls.listenToKeyEvents(window);

let scene = new three.Scene();
scene.add(new three.AmbientLight(0xffffff, 0.1));

let renderedObjects = new Map<Obj, [three.Mesh, three.Points]>();

let textureLoader = new three.TextureLoader();

function createRenderedObjects(obj: Obj): [three.Mesh, three.Points] {
    let geometry = new three.SphereGeometry(obj.radius / unitSize, 512, 512);
    let mesh = new three.Mesh(
        geometry,
        new three.MeshStandardMaterial({
            map: obj === trisolaris ? textureLoader.load('https://raw.githubusercontent.com/speedydelete/space/refs/heads/main/dist/data/textures/ssc/earth_8k.jpg') : undefined,
            color: obj.isStar ? obj.color : undefined,
            emissive: obj.isStar ? obj.color : undefined,
            emissiveIntensity: 2,
        }),
    );
    if (obj.isStar) {
        let light = new three.PointLight(obj.color);
        light.power = obj.luminosity * 93 / unitSize**2 / 20000;
        light.castShadow = true;
        mesh.add(light);
    }
    let points = new three.Points(
        geometry,
        new three.PointsMaterial({
            color: obj.color,
            size: 1,
            sizeAttenuation: false,
            depthTest: false,
        }),
    );
    scene.add(mesh);
    scene.add(points);
    renderedObjects.set(obj, [mesh, points]);
    mesh.visible = true;
    points.visible = false;
    return [mesh, points];
}

sim.objs.forEach(createRenderedObjects);

function updateMeshes(): void {
    for (let [obj, [mesh, points]] of renderedObjects) {
        let vector: three.Vector3;
        if (obj.isStar) {
            if (trisolaris.distanceTo(obj) < FLYING_STAR_DISTANCE) {
                mesh.visible = true;
                points.visible = false;
                vector = mesh.position;
            } else {
                mesh.visible = false;
                points.visible = true;
                vector = points.position;
            }
        } else {
            vector = mesh.position;
        }
        vector.set(obj.position.x / unitSize, obj.position.y / unitSize, obj.position.z / unitSize);
    }
}

function formatLength(value: number): string {
    if (Number.isNaN(value)) {
        return 'NaN';
    }
    let abs = Math.abs(value);
    if (abs < 10000) {
        return value.toFixed(3) + ' m';
    } else if (abs < 1e7) {
        return (value / 1000).toFixed(3) + ' km';
    } else if (abs < 1e9) {
        return (value / 1e6).toFixed(3) + ' Mm';
    } else if (abs < AU * 10000) {
        return (value / AU).toFixed(3) + ' AU';
    } else {
        return (value / LY).toFixed(3) + ' ly';
    }
}

function formatTime(value: number): string {
    let unit: string;
    if (value < 60) {
        unit = 'second';
    } else if (value < 3600) {
        value /= 60;
        unit = 'minute';
    } else if (value < 86400) {
        value /= 3600;
        unit = 'hour';
    } else if (value < 31536000) {
        value /= 86400;
        unit = 'day';
    } else {
        value /= 31536000;
        unit = 'year';
    }
    if (Math.abs(value - 1) < 0.001) {
        return '1 ' + unit;
    } else {
        let str = value.toFixed(3);
        while (str.endsWith('0')) {
            str = str.slice(0, -1);
        }
        if (str.endsWith('.')) {
            str = str.slice(0, -1);
        }
        return str + ' ' + unit + 's';
    }
}

function getStatus(): string {
    let distances: number[] = [];
    let flyingStars = 0;
    let frozenFlyingStars = 0;
    for (let star of [sun1, sun2, sun3]) {
        let dist = trisolaris.distanceTo(star);
        distances.push(dist);
        if (dist > FLYING_STAR_DISTANCE) {
            flyingStars++;
            if (trisolaris.relativeVelocity(star).abs() < 5000) {
                frozenFlyingStars++;
            }
        }
    }
    let out: string;
    if (flyingStars === 0) {
        out = 'Tri-solar day';
    } else if (flyingStars === 1) {
        out = 'Chaotic Era';
    } else if (flyingStars === 2) {
        out = 'Stable Era';
    } else if (flyingStars === 3) {
        out = 'Extreme cold period';
    } else {
        throw new Error(`Invalid number of flying stars: ${flyingStars}`);
    }
    return `${fps} FPS\n${formatTime(sim.timeWarp)}/second\n${out}\n${flyingStars} flying star${flyingStars === 1 ? '' : 's'}\n${frozenFlyingStars} frozen flying star${frozenFlyingStars === 1 ? '' : 's'}\nDistances to stars: ${distances.sort((x, y) => x - y).map(formatLength).join(', ')}`;
}

let blurred = false;
let frames = 0;
let prevRealTime = performance.now();
let fps = parseInt(localStorage['space-fps']) || 60;
let oldMeshPos = new three.Vector3(0, 0, 0);

function animate() {
    if (document.hidden || document.visibilityState === 'hidden') {
        blurred = true;
        requestAnimationFrame(animate);
        return;
    } else if (blurred) {
        blurred = false;
        frames = 0;
        prevRealTime = performance.now();
        fps = parseInt(localStorage['space-fps']);
    }
    if (fps > 0) {
        sim.update(1/fps);
    }
    frames++;
    let realTime = performance.now();
    if (realTime >= prevRealTime + 1000) {
        fps = Math.round((frames * 1000)/(realTime - prevRealTime));
        frames = 0;
        prevRealTime = realTime;
        localStorage['space-fps'] = fps;
    }
    updateMeshes();
    query('#left-info').textContent = getStatus();
    let objs = renderedObjects.get(trisolaris);
    if (objs) {
        let [mesh] = objs;
        camera.position.x += mesh.position.x - oldMeshPos.x;
        camera.position.y += mesh.position.y - oldMeshPos.y;
        camera.position.z += mesh.position.z - oldMeshPos.z;
        controls.target.copy(mesh.position);
        oldMeshPos.copy(mesh.position);
    }
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.addEventListener('load', () => {
    requestAnimationFrame(animate);
    setTimeout(() => {
        let objs = renderedObjects.get(trisolaris);
        if (objs) {
            let mesh = objs[0];
            camera.position.set(mesh.position.x + trisolaris.radius/unitSize*10, mesh.position.y, mesh.position.z);
        }
    }, 100);
});

window.addEventListener('keydown', event => {
    let key = event.key;
    if (key === '.') {
        sim.timeWarp *= 2;
    } else if (key === ',') {
        sim.timeWarp /= 2;
    } else if (key === '/') {
        sim.timeWarp = 1;
        event.preventDefault()
    }
});
