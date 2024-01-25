import { AmbientLight, Color, DirectionalLight, GridHelper, Matrix4, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import URDFLoader, { URDFRobot } from "urdf-loader"
import init, { Robot } from "wasm";
import { ref } from "vue";

export let ik_time = ref("");

export class RobotRenderer {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera
    robot: URDFRobot
    ik_robot: Robot
    tip: Object3D
    constructor(
        renderer: WebGLRenderer,
        scene: Scene,
        camera: PerspectiveCamera,
        robot: URDFRobot,
        ik_robot: Robot,
        tip: Object3D,
    ) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.robot = robot;
        this.ik_robot = ik_robot;
        this.tip = tip;
    }

    render() {
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
        let joints: number[] = [];
        for (let a in this.robot.joints) {
            joints.push(this.robot.joints[a].angle as number);
        }
        // console.log(joints.length);
        let start = performance.now();
        let new_joints = this.ik_robot.ik(new Float64Array(this.tip.matrix.elements), new Float64Array(joints));
        ik_time.value = ((performance.now() - start) * 1000).toFixed(4) + "us"
        this.robot.setJointValues({
            "panda_joint1": new_joints[0],
            "panda_joint2": new_joints[1],
            "panda_joint3": new_joints[2],
            "panda_joint4": new_joints[3],
            "panda_joint5": new_joints[4],
            "panda_joint6": new_joints[5],
            "panda_joint7": new_joints[6],
        });
    }
}

export function build_robot_renderer(container: HTMLDivElement) {
    // create renderer
    let renderer = new WebGLRenderer({
        // antialias
        antialias: true
    })

    // basic settings
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // create scene
    let scene = new Scene();
    // background color = gray
    scene.background = new Color(0x3c3c3c);

    // Perspective Camera & settings
    let camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 100);
    camera.position.set(1.5, 1.5, 1.5);
    camera.lookAt(0, 0, 0);
    let orb = new OrbitControls(camera, renderer.domElement);

    // AmbientLight
    let l1 = new AmbientLight(0xFFFFFF, 1);

    // DirectionalLight
    let l2 = new DirectionalLight(0xFFFFFF, 1);
    l2.position.set(0, 1.5, 1);

    // add lights to scene
    scene.add(l1);
    scene.add(l2);

    // add grid
    let grid = new GridHelper(10, 100);
    scene.add(grid);

    let loader = new URDFLoader();
    loader.load("./Panda/panda.urdf", (robot) => {
        robot.rotation.set(-90 / 360 * 2 * Math.PI, 0, 0);
        scene.add(robot);

        // add tip
        let tip = new Object3D();
        let t = new TransformControls(camera, renderer.domElement);
        t.attach(tip);
        t.setSpace("local");
        robot.add(tip);
        scene.add(t);
        new Matrix4().set(
            1, 0, 0, 0.3,
            0, -1, 0, 0,
            0, 0, -1, 0.6,
            0, 0, 0, 1
        ).decompose(tip.position, tip.quaternion, tip.scale);
        t.addEventListener('mouseDown', () => orb.enabled = false);
        t.addEventListener('mouseUp', () => {
            orb.enabled = true;
        });
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case "t":
                    t.setMode("translate");
                    break;
                case "r":
                    t.setMode("rotate");
                    break;
            }
        });

        fetch("./Panda/panda.urdf").then((res) => {
            return res.text();
        }).then((urdf) => {
            init().then(() => {
                console.log("wasm initialized");
                let ik_robot = new Robot(urdf, "panda_hand");
                robot_renderer = new RobotRenderer(renderer, scene, camera, robot, ik_robot, tip);
                robot_renderer.robot.setJointValues({
                    "panda_joint1": 0.,
                    "panda_joint2": -Math.PI / 4.,
                    "panda_joint3": 0.,
                    "panda_joint4": -3. * Math.PI / 4.,
                    "panda_joint5": 0.,
                    "panda_joint6": Math.PI / 2.,
                    "panda_joint7": Math.PI / 4.,
                });
                robot_renderer.render();
            })
        })

    }, () => { }, () => { console.log("error") });
}

export let robot_renderer: RobotRenderer | null = null;

window.onresize = function () {
    if (robot_renderer !== null) {
        robot_renderer.camera.aspect = window.innerWidth / window.innerHeight;
        robot_renderer.camera.updateProjectionMatrix();
        robot_renderer.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

