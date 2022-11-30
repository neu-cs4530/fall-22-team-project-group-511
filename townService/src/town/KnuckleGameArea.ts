import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { TrustProductsEvaluationsContext } from 'twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEvaluations';
import Player from '../lib/Player';
import {
  BoundingBox,
  Interactable,
  KnuckleGameArea as KnuckleGameAreaModel,
  TownEmitter,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class KnuckleGameArea extends InteractableArea {
  public gameRunning: boolean;

  public spectators: Player[];

  public board1: number[][];

  public board2: number[][];

  public player1?: Player;

  public player2?: Player;

  public dieRoll?: number;

  public isItPlayerOneTurn: boolean;

  /** The area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }

  public get spectatorsByID(): string[] {
    return this.spectators.map(player => player.id);
  }

  /**
   * Creates a new KnuckleGameArea
   *
   * @param knuckleGameAreaModel model containing this area's current topic and its ID
   * @param coordinates  the bounding box that defines this conversation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { id }: KnuckleGameAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this.gameRunning = false;
    this.spectators = [];
    this.board1 = this.createBoard();
    this.board2 = this.createBoard();
    this.isItPlayerOneTurn = true;
  }

  public toModel(): KnuckleGameAreaModel {
    return {
      id: this.id,
      occupantsByID: this.occupantsByID,
      gameRunning: this.gameRunning,
      spectatorsByID: this.spectatorsByID,
      board1: this.board1,
      board2: this.board2,
      player1ID: this.player1?.id,
      player2ID: this.player2?.id,
      isItPlayerOneTurn: this.isItPlayerOneTurn,
    };
  }

  /**
   * Removes a player from this game area.
   *
   * Extends the base behavior of InteractableArea to set the topic of this ConversationArea to undefined and
   * emit an update to other players in the town when the last player leaves.
   *
   * @param player
   */
  public remove(player: Player) {
    super.remove(player);

    if (this.player1?.id === player.id) {
      this.player1 = undefined;
    } else if (this.player2?.id === player.id) {
      this.player2 = undefined;
    } else {
      this.spectators.filter(p => p.id !== player.id);
    }

    if (this.gameRunning && (this.player1 === undefined || this.player2 === undefined)) {
      this.gameRunning = false;
      this.board1 = this.createBoard();
      this.board2 = this.createBoard();
      this.dieRoll = undefined;
      this.isItPlayerOneTurn = true;
      this._emitAreaChanged();
    }
  }

  /**
   * Adds a player to the tuple containing the currently playing players in this game area.
   *
   * @param player
   */
  public add(player: Player): void {
    super.add(player);
    if (this.player1 === undefined) {
      this.player1 = player;
    } else if (this.player2 === undefined) {
      this.player2 = player;
    } else {
      this.spectators.push(player);
    }
  }

  /**
   * Generates a random number between 1 and 6 and stores it in dieRoll.
   *
   * Returns early if the game is not running
   */
  public rollDie(player: Player): void {
    if (!this.gameRunning || this.player1 === undefined || this.player2 === undefined) {
      return;
    }
    if (this.isItPlayerOneTurn && player.id !== this.player1.id) {
      return;
    }
    if (!this.isItPlayerOneTurn && player.id !== this.player2.id) {
      return;
    }
    const roll: number = Math.floor(Math.random() * 6) + 1;
    this.dieRoll = roll;
  }

  /**
   * Allows a player to place a die on the board
   *
   * @param player
   * @param row
   *
   * @returns true if the player was able to place their die on the board, false if the player was not able to place their die on the board
   */
  public placeDie(player: Player, row: number): boolean {
    if (!this.gameRunning || this.player1 === undefined || this.player2 === undefined) {
      return false;
    }
    if (this.isItPlayerOneTurn && player.id !== this.player1.id) {
      return false;
    }
    if (!this.isItPlayerOneTurn && player.id !== this.player2.id) {
      return false;
    }
    if (this.dieRoll === undefined) {
      return false;
    }

    if (this.isItPlayerOneTurn) {
      const targetCol: number = this.board1[row].findIndex(e => e === 0);
      if (targetCol !== -1) {
        this.board1[row][targetCol] = this.dieRoll;
        while (this.board2[row].findIndex(e => e === this.dieRoll) !== -1) {
          const colToZero: number = this.board2[row].findIndex(e => e === this.dieRoll);
          this.board2[row][colToZero] = 0;
        }
        this.isItPlayerOneTurn = false;
      } else {
        return false;
      }
    } else {
      const targetCol: number = this.board2[row].findIndex(e => e === 0);
      if (targetCol !== -1) {
        this.board2[row][targetCol] = this.dieRoll;
        while (this.board1[row].findIndex(e => e === this.dieRoll) !== -1) {
          const colToZero: number = this.board1[row].findIndex(e => e === this.dieRoll);
          this.board1[row][colToZero] = 0;
        }
        this.isItPlayerOneTurn = true;
      } else {
        return false;
      }
    }

    this.dieRoll = undefined;
    return true;
  }

  /**
   * Starts a game if:
   * 1. player1 and player2 are defined
   * 2. The game is not already running
   *
   * @returns true if the game was started, false if the game was not started
   */
  public startGame(): void {
    if (this.player1 === undefined || this.player2 === undefined || this.gameRunning) {
      return;
    } else {
      this.gameRunning = true;
    }
  }

  createBoard(): number[][] {
    const board: number[][] = [];
    for (let i = 0; i < 3; i++) {
      board.push([0, 0, 0]);
    }
    return board;
  }

  /**
   * Creates a new ConversationArea object that will represent a Conversation Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this conversation area exists
   * @param broadcastEmitter An emitter that can be used by this conversation area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): KnuckleGameArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new KnuckleGameArea(
      {
        id: name,
        occupantsByID: [],
        spectatorsByID: [],
        gameRunning: false,
        board1: [][3],
        board2: [][3],
        isItPlayerOneTurn: true,
      },
      rect,
      broadcastEmitter,
    );
  }
}
