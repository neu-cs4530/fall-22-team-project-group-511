import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import Interactable from '../components/Town/Interactable';
import { GameArea } from '../generated/client/models/GameArea';
import { KnuckleGameArea as GameModel, Player } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';

/**
 * The events that the GameAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type GameAreaEvents = {
  occupantsChange: (newOccupants: PlayerController[]) => void;
  playersChange: (newPlayers: Player[]) => void;
  board1Change: (newBoard1: number[][]) => void;
  board2Change: (newBoard2: number[][]) => void;
  die1Change: (newDie1: number) => void;
  die2Change: (newDie2: number) => void;
  isItPlayerOneTurnChange: (newIsItPlayerOneTurn: boolean) => void;
  gameRunningChange: (newGameRunning: boolean) => void;
};

/**
 * A GameAreaController manages the local behavior of a game area in the frontend,
 * implementing the logic to bridge between the townService's interpretation of game areas and the
 * frontend's. The GameAreaController emits events when the game area changes.
 */
export default class GameAreaController extends (EventEmitter as new () => TypedEmitter<GameAreaEvents>) {
  private _occupants: PlayerController[] = [];

  private _id: string;

  private _board1: number[][] = [];

  private _board2: number[][] = [];

  private _players: Player[] = [];

  private _gameRunning = false;

  private _die1 = 0;

  private _die2 = 0;

  private _isItPlayerOneTurn = true;

  /**
   * Create a new GameAreaController
   * @param id
   */
  constructor(id: string) {
    super();
    this._id = id;
  }

  /**
   * The ID of this game area (read only)
   * @returns
   */
  get id() {
    return this._id;
  }

  /**
   * The list of occupants in this game area. Changing the set of occupants
   * will emit an occupantsChange event.
   */
   set occupants(newOccupants: PlayerController[]) {
    if (
      newOccupants.length !== this._occupants.length ||
      _.xor(newOccupants, this._occupants).length > 0
    ) {
      this.emit('occupantsChange', newOccupants);
      this._occupants = newOccupants;
    }
  }

  get occupants() {
    return this._occupants;
  }

  /**
   * The list of players in the current game.
   */
  get players() {
    return this._players;
  }

  set players(newPlayers: Player[]) {
    this._players = newPlayers;
  }

  /**
   * The board of the first player.
   */
  get board1() {
    return this._board1;
  }

  set board1(newBoard: number[][]) {
    this._board1 = newBoard;
  }

  /**
   * The board of the second player.
   */
  get board2() {
    return this._board2;
  }

  set board2(newBoard: number[][]) {
    this._board2 = newBoard;
  }

  /**
   * The value of the first die.
   */
  get die1() {
    return this._die1;
  }

  set die1(newDie: number) {
    this._die1 = newDie;
  }

  /**
   * The value of the second die.
   */
  get die2() {
    return this._die2;
  }

  set die2(newDie: number) {
    this._die2 = newDie;
  }

  /**
   * Whether the game is running or not.
   */
  get gameRunning() {
    return this._gameRunning;
  }

  set gameRunning(newGameRunning: boolean) {
    this._gameRunning = newGameRunning;
  }

  /**
   * Whether it is player one's turn or not.
   */
  get isItPlayerOneTurn() {
    return this._isItPlayerOneTurn;
  }

  set isItPlayerOneTurn(newIsItPlayerOneTurn: boolean) {
    this._isItPlayerOneTurn = newIsItPlayerOneTurn;
  }

  /**
   * A GameArea is empty if there are no occupants.
   */
  isEmpty() {
    return this._occupants.length === 0;
  }

  /**
   * Return a representation of this GameAreaController that matches the
   * townService's representation and is suitable for transmitting over the network.
   */
  toGameArea(): GameModel {
    return {
      id: this._id,
      occupantsByID: this.occupants.map(player => player.id),
      players: this._players,
      board1: this._board1,
      board2: this._board2,
      die1: this._die1,
      die2: this._die2,
      gameRunning: this._gameRunning,
      isItPlayerOneTurn: this._isItPlayerOneTurn,
    };
  }

  /**
   * Create a new GameAreaController to match a given GameAreaModel.
   * @param gAreaModel Game area to represent
   * @param playerFinder A function that will return a list of PlayerController's
   *                     matching a list of Player ID's
   */
  static fromGameAreaModel(
    gAreaModel: GameModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ): GameAreaController {
    const ret = new GameAreaController(gAreaModel.id);
    ret.occupants = playerFinder(gAreaModel.occupantsByID);
    ret.players = gAreaModel.players;
    ret.board1 = gAreaModel.board1;
    ret.board2 = gAreaModel.board2;
    ret.die1 = gAreaModel.die1;
    ret.die2 = gAreaModel.die2;
    ret.gameRunning = gAreaModel.gameRunning;
    ret.isItPlayerOneTurn = gAreaModel.isItPlayerOneTurn;
    return ret;
  }

  /**
   * Updates the game area to match a given GameAreaModel.
   * @param gAreaModel Game area to represent
   * @param playerFinder A function that will return a list of PlayerController's
   *                    matching a list of Player ID's
   */
  updateFromGameAreaModel(
    gAreaModel: GameModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ) {
    this.occupants = playerFinder(gAreaModel.occupantsByID);
    this.players = gAreaModel.players;
    this.board1 = gAreaModel.board1;
    this.board2 = gAreaModel.board2;
    this.die1 = gAreaModel.die1;
    this.die2 = gAreaModel.die2;
    this.gameRunning = gAreaModel.gameRunning;
    this.isItPlayerOneTurn = gAreaModel.isItPlayerOneTurn;
  }
  
}

/**
 * A react hook to retrieve the occupants of a GameAreaController, returning an array of PlayerController.
 *
 * This hook will re-render any components that use it when the set of occupants changes.
 */
export function useGameAreaOccupants(area: GameAreaController): PlayerController[] {
  const [occupants, setOccupants] = useState(area.occupants);
  useEffect(() => {
    area.addListener('occupantsChange', setOccupants);
    return () => {
      area.removeListener('occupantsChange', setOccupants);
    };
  }, [area]);
  return occupants;
}

/**
 * A react hook to retrieve the players of a GameAreaController, returning an array of Player.
 * If the game is not running, the players will be empty.
 * 
 * This hook will re-render any components that use it when the set of players changes.
 */
export function useGameAreaPlayers(area: GameAreaController): Player[] {
  const [players, setPlayers] = useState(area.players);
  useEffect(() => {
    area.addListener('playersChange', setPlayers);
    return () => {
      area.removeListener('playersChange', setPlayers);
    };
  }, [area]);
  return players;
}

/**
 * A react hook to retrieve the board1 of a GameAreaController.
 * 
 * This hook will re-render any components that use it when the board1 changes.
 */
export function useGameAreaBoard1(area: GameAreaController): number[][] {
  const [board1, setBoard1] = useState(area.board1);
  useEffect(() => {
    area.addListener('board1Change', setBoard1);
    return () => {
      area.removeListener('board1Change', setBoard1);
    };
  }, [area]);
  return board1;
}

/**
 * A react hook to retrieve the board2 of a GameAreaController.
 * 
 * This hook will re-render any components that use it when the board2 changes.
 */
export function useGameAreaBoard2(area: GameAreaController): number[][] {
  const [board2, setBoard2] = useState(area.board2);
  useEffect(() => {
    area.addListener('board2Change', setBoard2);
    return () => {
      area.removeListener('board2Change', setBoard2);
    };
  }, [area]);
  return board2;
}

/**
 * A react hook to retrieve the die1 of a GameAreaController.
 *
 * This hook will re-render any components that use it when the die1 changes.
 */
export function useGameAreaDie1(area: GameAreaController): number {
  const [die1, setDie1] = useState(area.die1);
  useEffect(() => {
    area.addListener('die1Change', setDie1);
    return () => {
      area.removeListener('die1Change', setDie1);
    };
  }, [area]);
  return die1;
}

/**
 * A react hook to retrieve the die2 of a GameAreaController.
 * 
 * This hook will re-render any components that use it when the die2 changes.
 */
export function useGameAreaDie2(area: GameAreaController): number {
  const [die2, setDie2] = useState(area.die2);
  useEffect(() => {
    area.addListener('die2Change', setDie2);
    return () => {
      area.removeListener('die2Change', setDie2);
    };
  }, [area]);
  return die2;
}

/**
 * A react hook to retrieve the gameRunning of a GameAreaController.
 * 
 * This hook will re-render any components that use it when the gameRunning changes.
 */
export function useGameAreaGameRunning(area: GameAreaController): boolean {
  const [gameRunning, setGameRunning] = useState(area.gameRunning);
  useEffect(() => {
    area.addListener('gameRunningChange', setGameRunning);
    return () => {
      area.removeListener('gameRunningChange', setGameRunning);
    };
  }, [area]);
  return gameRunning;
}

/**
 * A react hook to retrieve the isItPlayerOneTurn of a GameAreaController.
 * 
 * This hook will re-render any components that use it when the isItPlayerOneTurn changes.
 */
export function useGameAreaIsItPlayerOneTurn(area: GameAreaController): boolean {
  const [isItPlayerOneTurn, setIsItPlayerOneTurn] = useState(area.isItPlayerOneTurn);
  useEffect(() => {
    area.addListener('isItPlayerOneTurnChange', setIsItPlayerOneTurn);
    return () => {
      area.removeListener('isItPlayerOneTurnChange', setIsItPlayerOneTurn);
    };
  }, [area]);
  return isItPlayerOneTurn;
}