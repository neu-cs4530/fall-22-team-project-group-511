import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation } from '../types/CoveyTownSocket';
import GameAreaController, { GameAreaEvents } from './GameAreaController';
import PlayerController from './PlayerController';