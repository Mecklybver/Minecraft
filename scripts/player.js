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
  BoxGeometry,
  InstancedMesh,
  Group,
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
  activeBlockId = blocks.grass.id;
  maxSpeed = 5;
  jumpSpeed = 10;
  onGround = false;
  input = new Vector3();
  velocity = new Vector3();
  #worldVelocity = new Vector3();

  tool = {
    // Group that will contain the tool mesh
    container: new Group(),
    // Whether or not the tool is currently animating
    animate: false,
    // The time the animation was started
    animationStart: 0,
    // The rotation speed of the tool
    animationSpeed: 0.025,
    // Reference to the current animation
    animation: null,
  };

  /**
   *
   * @param {Scene} scene
   */
  constructor(scene, orbitControl) {
    this.scene = scene;
    this.position.set(32, 45, 32);
    this.orbitControl = orbitControl;
    scene.add(this.camera, this.cameraHelper);
    this.camera.layers.enable(1);
    this.camera.add(this.tool.container);
    this.param;

    this.cameraHelper.visible = false;
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    document.addEventListener("mousedown", this.onMouseDown.bind(this));

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
    this.param = world.params
    this.updateRaycaster(world);
    // this.updateBoundsHelper();
    this.updateFogUnderWater(world);

    if (this.tool.animate) {
      this.updateTool();
    }
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

      if (
        intersection.object instanceof InstancedMesh &&
        intersection.instanceId !== undefined
      ) {
        const blockMatrix = new Matrix4();
        intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

        this.selectedCoords = chunk.position.clone();
        this.selectedCoords.applyMatrix4(blockMatrix);

        if (this.activeBlockId !== blocks.empty.id) {
          this.selectedCoords.add(intersection.normal);
        }

        this.selectionHelper.position.copy(this.selectedCoords);
        this.selectionHelper.visible = true;
      } else {
        console.warn(
          "Intersected object is not an InstancedMesh or instanceId is undefined"
        );
      }
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  updateFogUnderWater(world) {
    const underwaterHeight = world.params.terrain.waterHeight; // Assuming you have this parameter available

    if (this.position.y < underwaterHeight && this.controls.isLocked) {
      this.scene.fog.color.set(0x0099cc); // Blueish color for underwater
      this.scene.fog.near = 1; // Adjust as needed
      this.scene.fog.far = 50; // Adjust as needed
    } else {
      this.scene.fog.color.set(0xffffff); // Clear color above water
      this.scene.fog.near = 1; // Reset to default
      this.scene.fog.far = 1000; // Reset to default
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

  setTool(tool) {
    this.tool.container.clear();
    this.tool.container.add(tool);
    this.tool.container.visible = false;
    this.tool.container.receiveShadow = true;
    this.tool.container.castShadow = true;

    this.tool.container.position.set(0.6, -0.3, -0.5);
    this.tool.container.scale.set(0.5, 0.5, 0.5);
    this.tool.container.rotation.z = Math.PI / 2;
    this.tool.container.rotation.y = Math.PI + 0.2;
  }

  updateTool() {
    if (this.tool.container.children.length > 0) {
      const t =
        this.tool.animationSpeed *
        (performance.now() - this.tool.animationStart);
      this.tool.container.children[0].rotation.y = 0.5 * Math.sin(t);
    }
  }

  /**
   * Set the tool object the player is holding
   * @param {THREE.Mesh} tool
   */

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
      case "Digit8":
        document.getElementById(`toolbar-${this.activeBlockId}`).classList.remove("selected");
        this.activeBlockId = Number(e.key);
        document.getElementById(`toolbar-${this.activeBlockId}`).classList.add("selected");


        console.log(`set block id to ${this.activeBlockId}`);

        this.tool.container.visible = this.activeBlockId === 0;

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
        this.position.set(32, 40, 32);
        this.velocity.set(0, 0, 0);
        break;
      case "Space":
    if (this.onGround || this.position.y < this.param.terrain.waterHeight) {
      this.velocity.y = this.jumpSpeed;
     if (this.position.y < this.param.terrain.waterHeight)
       this.velocity.y *= 1010;
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

  /**
   * Event handler for 'mousedown'' event
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    // If the tool isn't currently animating, trigger the animation
    if (!this.tool.animate) {
      this.tool.animate = true;
      this.tool.animationStart = performance.now();

      // Clear the existing timeout so it doesn't cancel our new animation
      clearTimeout(this.tool.animation);

      // Stop the animation after 1.5 cycles
      this.tool.animation = setTimeout(() => {
        this.tool.animate = false;
      }, (3 * Math.PI) / this.tool.animationSpeed);
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
