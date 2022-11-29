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

  public spectatorsByID: string[];

  public board1: number[][];

  public board2: number[][];

  public player1ID?: string;

  public player2ID?: string;

  public dieRoll?: number;

  public isItPlayerOneTurn: boolean;

  /** The area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
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
    this.spectatorsByID = [];
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
      player1ID: this.player1ID,
      player2ID: this.player2ID,
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

    if (this.player1ID === player.id) {
      this.player1ID = undefined;
    } else if (this.player2ID === player.id) {
      this.player2ID = undefined;
    } else {
      this.spectatorsByID.filter(p => p !== player.id);
    }

    if (this.gameRunning && (this.player1ID === undefined || this.player2ID === undefined)) {
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
    if (this.player1ID === undefined) {
      this.player1ID = player.id;
    } else if (this.player2ID === undefined) {
      this.player2ID = player.id;
    } else {
      this.spectatorsByID.push(player.id);
    }
  }

  /**
   * Generates a random number between 1 and 6 and stores it in dieRoll.
   *
   * Returns early if the game is not running
   */
  public rollDie(player: Player): void {
    if (!this.gameRunning || this.player1ID === undefined || this.player2ID === undefined) {
      return;
    }
    if (this.isItPlayerOneTurn && player.id !== this.player1ID) {
      return;
    }
    if (!this.isItPlayerOneTurn && player.id !== this.player2ID) {
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
    if (!this.gameRunning || this.player1ID === undefined || this.player2ID === undefined) {
      return false;
    }
    if (this.isItPlayerOneTurn && player.id !== this.player1ID) {
      return false;
    }
    if (!this.isItPlayerOneTurn && player.id !== this.player2ID) {
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
   * 1. player1ID and player2ID are defined
   * 2. The game is not already running
   *
   * @returns true if the game was started, false if the game was not started
   */
  public startGame(): void {
    if (this.player1ID === undefined || this.player2ID === undefined || this.gameRunning) {
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
}
