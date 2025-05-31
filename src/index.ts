
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {SM, SR, Vector3, Star, Planet, Obj, Simulation} from './simulation.js';


function query<T extends HTMLElement>(query: string): T {
    let elt = document.querySelector(query);
    if (!elt) {
        throw new Error(`Missing query: ${query}`);
    }
    return elt as T;
}


const AU = 149597870700;
const LY = 9.461e15;
const FLYING_STAR_DISTANCE = AU * 3;

function randomDistance(scale: number): number {
    return Math.random() * scale - (scale / 2);
}

function randomPositionVector(): Vector3 {
    let scale = Math.random() * (Math.random() * (Math.random() * 50)) * AU;
    return new Vector3(randomDistance(scale), randomDistance(scale), randomDistance(scale));
}

function randomSpeed(): number {
    return Math.random() * 30000 - 15000;
}

function randomVelocityVector(): Vector3 {
    return new Vector3(randomSpeed(), randomSpeed(), randomSpeed());
}

function createSimulation(): [Simulation, {trisolaris: Planet, sun1: Star, sun2: Star, sun3: Star}] {
    let trisolaris = new Planet({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        mass: 5.972168e24,
        radius: 6371000,
        albedo: 0.29,
        texture: 'https://raw.githubusercontent.com/speedydelete/space/refs/heads/main/dist/data/textures/ssc/earth_8k.jpg',
    });
    let sun1 = new Star({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        mass: SM * 1.25,
        radius: SR * 1.359,
    });
    let sun2 = new Star({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        mass: SM * 1.13,
        radius: SR * 1.167,
    });
    let sun3 = new Star({
        position: randomPositionVector(),
        velocity: randomVelocityVector(),
        mass: SM * 0.9,
        radius: SR * 0.853,
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

let planetMeshes = new Map<Planet, three.Mesh>();
let starMeshesAndPoints = new Map<Star, [three.Mesh, three.Points]>();

let textureLoader = new three.TextureLoader();

function createRenderedObjects(obj: Obj): void {
    let geometry = new three.SphereGeometry(obj.radius / unitSize, 512, 512);
    let material = new three.MeshStandardMaterial();
    if (obj instanceof Star) {
        let color = new three.Color(obj.color);
        material.color = color;
        material.emissive = color;
        material.emissiveIntensity = 10;
    } else {
        material.map = textureLoader.load(obj.texture);
    }
    let mesh = new three.Mesh(geometry, material);
    if (obj instanceof Star) {
        let light = new three.PointLight(obj.color);
        light.power = obj.luminosity * 93 / unitSize**2 / 20000;
        light.castShadow = true;
        mesh.add(light);
        let points = new three.Points(
            geometry,
            new three.PointsMaterial({
                color: new three.Color(obj.color),
                size: 1,
                sizeAttenuation: false,
                depthTest: false,
            }),
        );
        starMeshesAndPoints.set(obj, [mesh, points]);
        scene.add(points);
        points.visible = false;
    } else {
        planetMeshes.set(obj, mesh);
    }
    scene.add(mesh);
    mesh.visible = true;
}

sim.objs.forEach(createRenderedObjects);

let trisolarisMesh = planetMeshes.get(trisolaris) ?? (() => {throw new Error('Trisolaris mesh is missing')})();

function updateMeshes(): void {
    for (let [obj, [mesh, points]] of starMeshesAndPoints) {
        let vector: three.Vector3;
        if (trisolaris.distanceTo(obj) < FLYING_STAR_DISTANCE) {
            mesh.visible = true;
            points.visible = false;
            vector = mesh.position;
        } else {
            mesh.visible = false;
            points.visible = true;
            vector = points.position;
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
    return `${fps} FPS\n${formatTime(sim.timeWarp)}/second\n${out}\n${flyingStars} flying star${flyingStars === 1 ? '' : 's'}\n${frozenFlyingStars} frozen flying star${frozenFlyingStars === 1 ? '' : 's'}\nDistances to stars: ${distances.sort((x, y) => x - y).map(formatLength).join(', ')}\n${(sim.getTemperatureOf(trisolaris) - 273.15).toFixed(3)}°C`;
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
    let pos = trisolarisMesh.position;
    camera.position.x += pos.x - oldMeshPos.x;
    camera.position.y += pos.y - oldMeshPos.y;
    camera.position.z += pos.z - oldMeshPos.z;
    controls.target.copy(pos);
    oldMeshPos.copy(pos);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.addEventListener('load', () => {
    requestAnimationFrame(animate);
    setTimeout(() => {
        let pos = trisolarisMesh.position;
        camera.position.set(pos.x + trisolaris.radius/unitSize*10, pos.y, pos.z);
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
        event.preventDefault();
    }
});

console.log(sun1.color.toString(16), sun2.color.toString(16), sun3.color.toString(16), sun1.temperature, sun2.temperature, sun3.temperature);
