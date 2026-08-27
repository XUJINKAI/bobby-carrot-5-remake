import type { Direction } from "@bobby/model";
import type { Game } from "../core/Game.js";
import { ScreenJoystick, type ScreenJoystickOptions } from "./ScreenJoystick.js";

interface PointerState { x:number; y:number; startX:number; startY:number; moved:boolean; }
export interface InputControllerOptions {
  keyboard?: boolean; pointer?: boolean; movement?: boolean; undo?: boolean; redo?: boolean;
  restart?: boolean; pan?: boolean; zoom?: boolean; debug?: boolean;
  screenJoystick?: boolean | ScreenJoystickOptions;
}
interface InputCapabilities { keyboard:boolean;pointer:boolean;movement:boolean;undo:boolean;redo:boolean;restart:boolean;pan:boolean;zoom:boolean;debug:boolean; }
const KEY_DIRECTION: Record<string, Direction> = { arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right" };

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private readonly capabilities: InputCapabilities;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private readonly screenJoystick: ScreenJoystick | null;
  private externalDirection: Direction | null = null;
  private joystickDirection: Direction | null = null;
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private suppressNextClick = false;
  private enabled = true;

  constructor(private readonly game: Game, options: InputControllerOptions = {}) {
    this.canvas = game.renderer.canvas;
    this.capabilities = {
      keyboard: options.keyboard ?? true, pointer: options.pointer ?? true, movement: options.movement ?? true,
      undo: options.undo ?? true, redo: options.redo ?? options.undo ?? true, restart: options.restart ?? true,
      pan: options.pan ?? true, zoom: options.zoom ?? true, debug: options.debug ?? true,
    };
    window.addEventListener("keydown", this.onKeyDown, { passive:false });
    window.addEventListener("keyup", this.onKeyUp, { passive:false });
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive:false });
    const joystick = options.screenJoystick;
    this.screenJoystick = joystick === undefined || joystick === false ? null : new ScreenJoystick(this.canvas, joystick === true ? {} : joystick, this.setJoystickDirection);
  }

  setEnabled(value:boolean):void { this.enabled=value; this.screenJoystick?.setInteractionEnabled(value); if(!value) this.clearHeldMovement(); }
  setScreenJoystickEnabled(value:boolean):void { this.screenJoystick?.setEnabled(value); }
  setHeldDirection(direction:Direction|null):void { this.externalDirection = this.enabled && this.capabilities.movement ? direction : null; this.applyHeldDirection(); }
  consumePointerClickSuppression():boolean { const value=this.suppressNextClick; this.suppressNextClick=false; return value; }
  destroy():void {
    this.clearHeldMovement();
    window.removeEventListener("keydown",this.onKeyDown); window.removeEventListener("keyup",this.onKeyUp); window.removeEventListener("blur",this.onBlur);
    this.canvas.removeEventListener("pointerdown",this.onPointerDown); this.canvas.removeEventListener("pointermove",this.onPointerMove);
    this.canvas.removeEventListener("pointerup",this.onPointerUp); this.canvas.removeEventListener("pointercancel",this.onPointerUp); this.canvas.removeEventListener("wheel",this.onWheel);
    this.screenJoystick?.destroy();
  }

  private readonly onKeyDown=(event:KeyboardEvent):void=>{
    if(!this.enabled||!this.capabilities.keyboard||!this.game.hasLevel)return;
    const key=event.key.toLowerCase(); const direction=KEY_DIRECTION[key];
    if(direction&&this.capabilities.movement){event.preventDefault();if(!event.repeat&&!this.heldMovementKeys.includes(key))this.heldMovementKeys.push(key);this.applyHeldDirection();return;}
    if(event.repeat)return;
    if(key==="r"&&this.capabilities.restart)this.game.restart();
    else if(key==="z"&&event.shiftKey&&this.capabilities.redo)this.game.redo();
    else if((key==="z"||key==="u")&&this.capabilities.undo)this.game.undo();
    else if((key==="="||key==="+")&&this.capabilities.zoom)this.game.zoomBy(1.1);
    else if((key==="-"||key==="_")&&this.capabilities.zoom)this.game.zoomBy(1/1.1);
    else if(this.capabilities.debug&&(event.code==="Backquote"||key==="`"||key==="~"))this.game.toggleDebug();
  };
  private readonly onKeyUp=(event:KeyboardEvent):void=>{const key=event.key.toLowerCase();if(!this.capabilities.keyboard||!KEY_DIRECTION[key]||!this.capabilities.movement)return;event.preventDefault();const index=this.heldMovementKeys.lastIndexOf(key);if(index>=0)this.heldMovementKeys.splice(index,1);this.applyHeldDirection();};
  private readonly onBlur=():void=>{this.screenJoystick?.reset();this.clearHeldMovement();};
  private clearHeldMovement():void{this.heldMovementKeys.length=0;this.externalDirection=null;this.joystickDirection=null;this.game.setHeldDirection(null);}
  private applyHeldDirection():void{this.game.setHeldDirection(this.joystickDirection??this.externalDirection??this.currentKeyboardDirection());}
  private readonly setJoystickDirection=(direction:Direction|null):void=>{this.joystickDirection=direction;this.applyHeldDirection();};
  private currentKeyboardDirection():Direction|null{const key=this.heldMovementKeys.at(-1);return key?(KEY_DIRECTION[key]??null):null;}

  private readonly onPointerDown=(event:PointerEvent):void=>{if(!this.enabled||!this.capabilities.pointer||(!this.capabilities.pan&&!this.capabilities.zoom))return;if(event.pointerType==="mouse"&&event.button!==0&&event.button!==1)return;event.preventDefault();this.canvas.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false});if(this.capabilities.zoom&&this.pointers.size===2){this.pinchStartDistance=this.pointerDistance();this.pinchStartZoom=this.game.zoom;}};
  private readonly onPointerMove=(event:PointerEvent):void=>{const pointer=this.pointers.get(event.pointerId);if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;if(Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)>=4)pointer.moved=true;if(this.capabilities.zoom&&this.pointers.size===2&&this.pinchStartDistance>0){this.game.setZoom(this.pinchStartZoom*(this.pointerDistance()/this.pinchStartDistance));return;}if(this.capabilities.pan&&this.pointers.size===1&&(dx!==0||dy!==0))this.game.panByScreen(dx,dy);};
  private readonly onPointerUp=(event:PointerEvent):void=>{const pointer=this.pointers.get(event.pointerId);const wasPinching=this.pointers.size>=2;this.pointers.delete(event.pointerId);if((event.pointerType!=="mouse"||event.button===0)&&(pointer?.moved||wasPinching))this.suppressNextClick=true;if(this.pointers.size<2)this.pinchStartDistance=0;};
  private readonly onWheel=(event:WheelEvent):void=>{if(!this.enabled||!this.capabilities.pointer||!this.capabilities.zoom)return;event.preventDefault();this.game.zoomBy(event.deltaY<0?1.08:1/1.08);};
  private pointerDistance():number{const [a,b]=[...this.pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
}
