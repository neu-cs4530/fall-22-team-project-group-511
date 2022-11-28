import GameAreaController from '../../../classes/GameAreaController';
import TownController from '../../../classes/TownController';
import { BoundingBox } from '../../../types/CoveyTownSocket';
import Interactable, { KnownInteractableTypes } from '../Interactable';
import TownGameScene from '../TownGameScene';

export default class GameArea extends Interactable {
  //variables for the game
  private _player1Name?: Phaser.GameObjects.Text;
  private _player2Name?: Phaser.GameObjects.Text;
  private _dieValue?: Phaser.GameObjects.Text;
  private _board1Value?: Phaser.GameObjects.Text;
  private _board2Value?: Phaser.GameObjects.Text;
  private _gameArea?: GameAreaController;
  private _townController: TownController;

  constructor(scene: TownGameScene) {
    super(scene);
    this._townController = scene.coveyTownController;
    this.setTintFill();
    this.setAlpha(0.3);
    this._townController.addListener('gameAreasChanged', this._updateGameAreas);
  }

  private get _player1NameText() {
    const ret = this._player1Name;
    if (!ret) {
      throw new Error('Expected player 1 name to be defined');
    }
    return ret;
  }

  private get _player2NameText() {
    const ret = this._player2Name;
    if (!ret) {
      throw new Error('Expected player 2 name to be defined');
    }
    return ret;
  }

  private get _dieValueText() {
    const ret = this._dieValue;
    if (!ret) {
      throw new Error('Expected die 1 value to be defined');
    }
    return ret;
  }

  private get _board1ValueText() {
    const ret = this._board1Value;
    if (!ret) {
      throw new Error('Expected board 1 value to be defined');
    }
    return ret;
  }

  private get _board2ValueText() {
    const ret = this._board2Value;
    if (!ret) {
      throw new Error('Expected board 2 value to be defined');
    }
    return ret;
  }

  getType(): KnownInteractableTypes {
    return 'gameArea';
  }

  removedFromScene(): void {}

  addedToScene(): void {
    super.addedToScene();
    this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      this.name,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._player1Name = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Player 1)',
      { color: '#000000' },
    );
    this._player2Name = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Player 2)',
      { color: '#000000' },
    );
    this._dieValue = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Die)',
      { color: '#000000' },
    );
    this._board1Value = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Board 1)',
      { color: '#000000' },
    );
    this._board2Value = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Board 2)',
      { color: '#000000' },
    );
    this._updateGameAreas();
  }

  private _updateGameAreas = (areas: GameAreaController[] = []): void => {
    const area = areas.find(a => a.id === this.id);
    if (area) {
      this._gameArea = area;
      this._player1NameText.setText(area.player1?.userName ?? '(No Player 1)');
      this._player2NameText.setText(area.player2?.userName ?? '(No Player 2)');
      this._dieValueText.setText(area.die?.toString() ?? '(No Die)');
      this._board1ValueText.setText(area.board1?.toString() ?? '(No Board 1)');
      this._board2ValueText.setText(area.board2?.toString() ?? '(No Board 2)');
    }
  };

  getBoundingBox(): BoundingBox {
    const { x, y, width, height } = this.getBounds();
    return { x, y, width, height };
  }
}
