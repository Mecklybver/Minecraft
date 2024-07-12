import {
  PerspectiveCamera,
  Mesh,
  Vector3,
  Scene,
  CameraHelper,
  CylinderGeometry,
  CapsuleGeometry,
  MeshBasicMaterial,
  Euler,
  Raycaster,
  Vector2,
  Matrix4,
  BoxGeometry
} from "three";
import { blocks } from "./blocks";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import { isGuiVisible } from "./gui";

const CENTER_SCREEN = new Vector2();
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
  raycaster = new Raycaster(undefined, undefined, 0, 5);
  selectedCoords = null;
  activeBlockId = blocks.grass.id
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
  constructor(scene, orbitControl) {
    this.position.set(32, 32, 32);
    this.orbitControl = orbitControl;
    scene.add(this.camera, this.cameraHelper);
    this.cameraHelper.visible = false;
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    this.boundsHelper = new Mesh(
      new CylinderGeometry(this.radius, this.radius, this.height, 16),
      new MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    const selectionMaterial = new MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.5,
    });
    const selectionGeometry = new BoxGeometry(1.001, 1.001, 1.001);
    this.selectionHelper = new Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
  }
  /**
   *
   * @param {World} world
   */
  update(world) {
    this.updateRaycaster(world);
    // this.updateBoundsHelper();
  }
  /**
   *
   * @param {World} world
   */

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);
    if (intersections.length > 0) {
      const intersection = intersections[0];

      const chunk = intersection.object.parent;


      const blockMatrix = new Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal)

      }


      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }

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
      case "Digit0":
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
      case "Digit6":
      case "Digit7":
        this.activeBlockId = Number(e.key);
        console.log(`set block id to ${this.activeBlockId}`);

        break;
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
      case "KeyP":
      //orbitControl position to player position
        this.orbitControl.position.copy(this.position);
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
