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
        occupantsByID: [],
        board1: [],
        board2: [],
        players: [],
        gameRunning: false,
        die1: 0,
        die2: 0,
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
      expect(testArea.isActive).toBe(true);
    });
    it('returns false when there are no players inside of the area', () => {
      expect(testArea.isActive).toBe(false);
    });
    it('changes from false to true when player count goes from 0 to 1', () => {
      expect(testArea.isActive).toBe(false);
      testArea.add(player1);
      expect(testArea.isActive).toBe(true);
    });
    it('changes from true to false when player count goes from 1 to 0', () => {
      testArea.add(player1);
      expect(testArea.isActive).toBe(true);
      testArea.remove(player1);
      expect(testArea.isActive).toBe(false);
    });
  });
  describe('remove', () => {
    it('successfully removes a player from the area', () => {
      testArea.add(player1);
      testArea.remove(player1);
      expect(testArea.occupantsByID).toBe([]);
    });
    it('emits an event when removing a player brings the player count down to 0', () => {
      testArea.add(player1);
      testArea.remove(player1);
      expect(townEmitter.emit('interactableUpdate')).toHaveBeenCalled();
    });
    it('does not emit an event when removing a player does not bring the player count down to 0', () => {
      testArea.add(player1);
      testArea.add(player2);
      testArea.remove(player2);
      expect(townEmitter.emit('interactableUpdate')).not.toHaveBeenCalled();
    });
  });
  describe('addPlayer', () => {
    it("adds a player to the area, provided that they aren't already inside", () => {
      const ids = [player1.id];
      expect(testArea.occupantsByID).toEqual([]);
      testArea.addPlayer(player1);
      expect(testArea.occupantsByID).toEqual(ids);
    });
    it('returns true upon successfully adding a player', () => {
      const result = testArea.addPlayer(player1);
      expect(result).toBe(true);
    });
    it('returns false if the player is already inside the area', () => {
      testArea.addPlayer(player1);
      const result = testArea.addPlayer(player1);
      expect(result).toBe(false);
    });
    it('returns false if there are already two players inside the area', () => {
      testArea.addPlayer(player1);
      testArea.addPlayer(player2);
      const result = testArea.addPlayer(player3);
      expect(result).toBe(false);
    });
  });
  describe('rollDie', () => {
    it('returns a number between 1 and 6', () => {
      const roll = testArea.rollDie();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    });
    it('does not return anything less than 1', () => {
      const roll = testArea.rollDie();
      expect(roll).not.toBeLessThan(1);
    });
    it('does not return anything greater than 6', () => {
      const roll = testArea.rollDie();
      expect(roll).not.toBeGreaterThan(6);
    });
    it("changes the value of die1 if it is player 1's turn", () => {
      testArea.isItPlayerOneTurn = true;
      testArea.die1 = 0;
      testArea.die2 = 0;
      testArea.rollDie();
      expect(testArea.die1).toBeGreaterThanOrEqual(1);
      expect(testArea.die1).toBeLessThanOrEqual(6);
      expect(testArea.die2).toBe(0);
    });
    it("changes the value of die2 if it is player 2's turn", () => {
      testArea.isItPlayerOneTurn = true;
      testArea.die1 = 0;
      testArea.die2 = 0;
      testArea.rollDie();
      expect(testArea.die2).toBeGreaterThanOrEqual(1);
      expect(testArea.die2).toBeLessThanOrEqual(6);
      expect(testArea.die1).toBe(0);
    });
  });
  describe('placeDie', () => {
    it('returns true if a die is successfully placed', () => {
      testArea.addPlayer(player1);
      testArea.addPlayer(player2);
      testArea.startGame();
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      const result = testArea.placeDie(0, 0);
      expect(result).toBe(true);
    });
    it('returns false if a die is unsuccessfully placed', () => {
      testArea.addPlayer(player1);
      testArea.addPlayer(player2);
      testArea.startGame();
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      testArea.placeDie(0, 0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      const result = testArea.placeDie(0, 0);
      expect(result).toBe(false);
    });
    it('changes the value of a board cell when successfully placed', () => {
      testArea.addPlayer(player1);
      testArea.addPlayer(player2);
      testArea.startGame();
      expect(testArea.board1[0][0]).toBe(0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      testArea.placeDie(0, 0);
      expect(testArea.board1[0][0]).not.toBe(0);
    });
    it('does not change the value of a board cell when unsuccessfully placed', () => {
      testArea.addPlayer(player1);
      testArea.addPlayer(player2);
      testArea.startGame();
      expect(testArea.board1[0][0]).toBe(0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      testArea.placeDie(0, 0);
      const oldVal = testArea.board1[0][0];
      expect(oldVal).not.toBe(0);
      testArea.isItPlayerOneTurn = true;
      testArea.rollDie();
      testArea.placeDie(0, 0);
      expect(testArea.board1[0][0]).toBe(oldVal);
    });
  });
});
