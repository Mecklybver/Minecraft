import {
  PerspectiveCamera,
  Mesh,
  Vector3,
  Scene,
  CameraHelper,
  CylinderGeometry,
  MeshBasicMaterial,
  Euler,
} from "three";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import { isGuiVisible } from "./gui";
export class Player {
  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  radius = 0.5;
  height = 1.75;
  velocity = new Vector3();
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new CameraHelper(this.camera);
  maxSpeed = 5;
  jumpSpeed = 10;
  onGround = false;
  input = new Vector3();
  velocity = new Vector3();
  #worldVelocity = new Vector3();

  /**
   *
   * @param {Scene} scene
   */
  constructor(scene) {
    this.position.set(32, 32, 32);
    scene.add(this.camera, this.cameraHelper);

    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    this.boundsHelper = new Mesh(
      new CylinderGeometry(this.radius, this.radius, this.height, 16),
      new MeshBasicMaterial({ wireframe: true })
    );

    scene.add(this.boundsHelper);
  }

  applyInputs(deltaTime) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * deltaTime);
      this.controls.moveForward(this.velocity.z * deltaTime);
      this.position.y += this.velocity.y * deltaTime;
      isGuiVisible
        ? (document.getElementById("player-position").innerHTML =
            this.toString())
        : (document.getElementById("player-position").innerHTML = ``);
    }
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * @type {Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * @param {KeyboardEvent} e
   *
   */

  onKeyDown(e) {
    if (
      !this.controls.isLocked &&
      e.code !== "F1" &&
      e.code !== "ControlLeft" &&
      e.code !== "Escape"
    ) {
      this.controls.lock();
    }

    switch (e.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;

      case "KeyR":
        this.position.set(32, 16, 32);
        this.velocity.set(0, 0, 0);
        break;
      case "Space":
        if (this.onGround) {
          this.velocity.y = this.jumpSpeed;
        }
        break;

      default:
        break;
    }
  }
  /**
   * @param {KeyboardEvent} e
   *
   */

  onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyS":
        this.input.z = 0;

        break;
      case "KeyA":
        this.input.x = 0;

        break;
      case "KeyD":
        this.input.x = 0;
        break;

      default:
        break;
    }
  }
  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(3)}`;
    str += `Y: ${this.position.y.toFixed(3)}`;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {Vector3} dv
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }
}
