import { ThemeProvider } from '@emotion/react';
import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import { KnuckleGameArea as GameModel } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';

/**
 * The events that the GameAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type GameAreaEvents = {
  occupantsChange: (newOccupants: PlayerController[]) => void;
  spectatorsChange: (newSpectators: PlayerController[]) => void;
  player1Change: (newPlayer: PlayerController) => void;
  player2Change: (newPlayer: PlayerController) => void;
  board1Change: (newBoard1: number[][]) => void;
  board2Change: (newBoard2: number[][]) => void;
  dieChange: (newDie: number) => void;
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

  private _gameRunning: boolean;

  private _spectators: PlayerController[] = [];

  private _board1: number[][];

  private _board2: number[][];

  private _player1?: PlayerController;

  private _player2?: PlayerController;

  private _dieRoll?: number;

  private _isItPlayerOneTurn: boolean;

  /**
   * Create a new GameAreaController
   * @param id
   */
  constructor(id: string) {
    super();
    this._id = id;
    this._gameRunning = false;
    this._board1 = [];
    this._board2 = [];
    this._isItPlayerOneTurn = true;
  }

  /**
   * The ID of this game area (read only)
   * @returns
   */
  get id() {
    return this._id;
  }

  /**
   * The list of spectators in this game area. Changing the set of spectators
   * will emit an spectatorsChange event.
   */
  set spectators(newSpectators: PlayerController[]) {
    if (
      newSpectators.length !== this._occupants.length ||
      _.xor(newSpectators, this._spectators).length > 0
    ) {
      this.emit('spectatorsChange', newSpectators);
      this._spectators = newSpectators;
    }
  }

  get spectators() {
    return this._spectators;
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
   * Player 1 Accessor
   */
  get player1(): PlayerController | undefined {
    return this._player1;
  }

  /**
   * Player 1 Setter
   */
  set player1(newPlayer: PlayerController | undefined) {
    this._player1 = newPlayer;
  }

  /**
   * Player 2 Accessor
   */
  get player2(): PlayerController | undefined {
    return this._player2;
  }

  /**
   * Player 2 Setter
   */
  set player2(newPlayer: PlayerController | undefined) {
    this._player2 = newPlayer;
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
   * The value of the die.
   */
  get die(): number | undefined {
    return this._dieRoll;
  }

  set die(newDie: number | undefined) {
    this._dieRoll = newDie;
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
      spectatorsByID: this._spectators.map(player => player.id),
      player1ID: this._player1?.id,
      player2ID: this._player2?.id,
      board1: this._board1,
      board2: this._board2,
      dieRoll: this._dieRoll,
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
    ret.spectators = playerFinder(gAreaModel.spectatorsByID);
    ret.player1 =
      gAreaModel.player1ID === undefined ? undefined : playerFinder([gAreaModel.player1ID]).pop();
    ret.player2 =
      gAreaModel.player2ID === undefined ? undefined : playerFinder([gAreaModel.player2ID]).pop();
    ret.board1 = gAreaModel.board1;
    ret.board2 = gAreaModel.board2;
    ret.die = gAreaModel.dieRoll;
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
    this.spectators = playerFinder(gAreaModel.spectatorsByID);
    this.player1 =
      gAreaModel.player1ID === undefined ? undefined : playerFinder([gAreaModel.player1ID]).pop();
    this.player2 =
      gAreaModel.player2ID === undefined ? undefined : playerFinder([gAreaModel.player2ID]).pop();
    this.board1 = gAreaModel.board1;
    this.board2 = gAreaModel.board2;
    this.die = gAreaModel.dieRoll;
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
 * A react hook to retrieve the spectators of a GameAreaController, returning an array of PlayerController.
 *
 * This hook will re-render any components that use it when the set of spectators changes.
 */
export function useGameAreaSpectators(area: GameAreaController): PlayerController[] {
  const [spectators, setSpectators] = useState(area.spectators);
  useEffect(() => {
    area.addListener('spectatorsChange', setSpectators);
    return () => {
      area.removeListener('spectatorsChange', setSpectators);
    };
  }, [area]);
  return spectators;
}

/**
 * A react hook to retrieve player 1 of a GameAreaController, returning player 1.
 * If the game is not running or player 1 has left, then player 1 will be empty.
 *
 * This hook will re-render any components that use it when player 1 changes.
 */
export function useGameAreaPlayer1(area: GameAreaController): PlayerController | undefined {
  const [player1, setPlayer1] = useState(area.player1);
  useEffect(() => {
    area.addListener('player1Change', setPlayer1);
    return () => {
      area.removeListener('player1Change', setPlayer1);
    };
  }, [area]);
  return player1;
}

/**
 * A react hook to retrieve player 2 of a GameAreaController, returning player 2.
 * If the game is not running or player 2 has left, then player 2 will be empty.
 *
 * This hook will re-render any components that use it when player 2 changes.
 */
export function useGameAreaPlayer2(area: GameAreaController): PlayerController | undefined {
  const [player2, setPlayer2] = useState(area.player2);
  useEffect(() => {
    area.addListener('player2Change', setPlayer2);
    return () => {
      area.removeListener('player2Change', setPlayer2);
    };
  }, [area]);
  return player2;
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
 * A react hook to retrieve the die of a GameAreaController.
 *
 * This hook will re-render any components that use it when the die1 changes.
 */
export function useGameAreaDie(area: GameAreaController): number | undefined {
  const [die, setDie] = useState(0);
  useEffect(() => {
    area.addListener('dieChange', setDie);
    return () => {
      area.removeListener('dieChange', setDie);
    };
  }, [area]);
  return die;
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
