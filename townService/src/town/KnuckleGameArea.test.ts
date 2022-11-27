import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import KnuckleGameArea from './KnuckleGameArea';

describe('KnuckleGameArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: KnuckleGameArea;
  const townEmitter = mock<TownEmitter>();
  const id = nanoid();
  let player1: Player;
  let player2: Player;
  let player3: Player;

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new KnuckleGameArea(
      {
        id,
        gameRunning: false,
        spectators: [],
        occupantsByID: [],
        board1: [],
        board2: [],
        player1: undefined,
        player2: undefined,
        dieRoll: undefined,
        isItPlayerOneTurn: true,
      },
      testAreaBox,
      townEmitter,
    );
    player1 = new Player(nanoid(), mock<TownEmitter>());
    player2 = new Player(nanoid(), mock<TownEmitter>());
    player3 = new Player(nanoid(), mock<TownEmitter>());
  });
  describe('isActive', () => {
    it('returns true when there is at least one player inside of the area', () => {
      testArea.add(player1);
      expect(testArea.isActive).toEqual(true);
    });
    it('returns false when there are no players inside of the area', () => {
      expect(testArea.isActive).toEqual(false);
    });
    it('changes from false to true when player count goes from 0 to 1', () => {
      expect(testArea.isActive).toEqual(false);
      testArea.add(player1);
      expect(testArea.isActive).toEqual(true);
    });
    it('changes from true to false when player count goes from 1 to 0', () => {
      testArea.add(player1);
      expect(testArea.isActive).toEqual(true);
      testArea.remove(player1);
      expect(testArea.isActive).toEqual(false);
    });
  });
  describe('remove', () => {
    it('successfully removes a player from the area', () => {
      testArea.add(player1);
      testArea.remove(player1);
      expect(testArea.occupantsByID).toEqual([]);
    });
    it('sets player1 to undefined when that player leaves', () => {
      testArea.add(player1);
      expect(testArea.player1?.id).toEqual(player1.id);
      testArea.remove(player1);
      expect(testArea.player1).toBeUndefined();
    });
    it('sets player2 to undefined when that player leaves', () => {
      testArea.add(player1);
      testArea.add(player2);
      expect(testArea.player2?.id).toEqual(player2.id);
      testArea.remove(player2);
      expect(testArea.player2).toBeUndefined();
    });
    it('emits an event when removing a player (add an extra player so we are not testing what happens when the last player leaves)', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.remove(player1);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        occupantsByID: [player2.id],
        gameRunning: false,
        spectators: [],
        board1: testArea.createBoard(),
        board2: testArea.createBoard(),
        player1: undefined,
        player2: player2,
        dieRoll: undefined,
        isItPlayerOneTurn: true,
      });
    });
  });
  describe('add', () => {
    it('adds a player to the area', () => {
      expect(testArea.occupantsByID).not.toContain(player1.id);
      testArea.add(player1);
      expect(testArea.occupantsByID).toContain(player1.id);
    });
    it('makes a player the player1, if player1 is undefined', () => {
      expect(testArea.player1).toBeUndefined();
      testArea.add(player1);
      expect(testArea.player1).not.toBeUndefined();
      if (testArea.player1 !== undefined) {
        expect(testArea.player1.id).toEqual(player1.id);
      }
    });
    it('makes a player the player2, if player1 is defined and player2 is undefined', () => {
      testArea.add(player1);
      expect(testArea.player1).not.toBeUndefined();
      expect(testArea.player2).toBeUndefined();
      testArea.add(player2);
      expect(testArea.player2).not.toBeUndefined();
      if (testArea.player2 !== undefined) {
        expect(testArea.player2.id).toEqual(player2.id);
      }
    });
    it('makes a player a spectator, if both player1 and player2 are defined', () => {
      testArea.add(player1);
      testArea.add(player2);
      expect(testArea.player1).not.toBeUndefined();
      expect(testArea.player2).not.toBeUndefined();
      expect(testArea.spectators).toEqual([]);
      testArea.add(player3);
      expect(testArea.spectators).not.toEqual([]);
      expect(testArea.spectators).toContain(player3);
    });
  });
  describe('rollDie', () => {
    it('returns a number between 1 and 6', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      expect(testArea.gameRunning).toEqual(true);
      expect(testArea.dieRoll).toBeUndefined();
      testArea.rollDie(player1);
      expect(testArea.dieRoll).toBeGreaterThanOrEqual(1);
      expect(testArea.dieRoll).toBeLessThanOrEqual(6);
    });
    it('does not return anything less than 1', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      expect(testArea.dieRoll).toBeUndefined();
      testArea.rollDie(player1);
      expect(testArea.dieRoll).not.toBeLessThan(1);
    });
    it('does not return anything greater than 6', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      expect(testArea.dieRoll).toBeUndefined();
      testArea.rollDie(player1);
      expect(testArea.dieRoll).not.toBeGreaterThan(6);
    });
    it("does nothing if player2 calls rollDie and it is player1's turn", () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      expect(testArea.dieRoll).toBeUndefined();
      testArea.rollDie(player2);
      expect(testArea.dieRoll).toBeUndefined();
    });
    it("does nothing if player1 calls rollDie and it is player2's turn", () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      testArea.isItPlayerOneTurn = false;
      expect(testArea.dieRoll).toBeUndefined();
      testArea.rollDie(player1);
      expect(testArea.dieRoll).toBeUndefined();
    });
  });
  describe('placeDie', () => {
    it('returns true if a die is successfully placed', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      testArea.rollDie(player1);
      const result = testArea.placeDie(player1, 0);
      expect(result).toEqual(true);
    });
    it('returns false if a die is unsuccessfully placed', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      testArea.rollDie(player1);
      testArea.placeDie(player1, 0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie(player1);
      testArea.placeDie(player1, 0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie(player1);
      testArea.placeDie(player1, 0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie(player1);
      testArea.placeDie(player1, 0);
      testArea.isItPlayerOneTurn = true;
      const result = testArea.placeDie(player1, 0);
      expect(result).toEqual(false);
    });
    it('changes the value of a board cell when successfully placed', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.startGame();
      expect(testArea.board1[0][0]).toEqual(0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie(player1);
      testArea.placeDie(player1, 0);
      expect(testArea.board1[0][0]).not.toEqual(0);
    });
  });
});
