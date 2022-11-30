import Phaser from 'phaser';
import React, { useEffect, useState } from 'react';
import GameAreaController from '../../classes/GameAreaController';
import useTownController from '../../hooks/useTownController';
import SocialSidebar from '../SocialSidebar/SocialSidebar';
import KnuckleModal from './interactables/knucklebones/knuckleModal';
import NewConversationModal from './interactables/NewCoversationModal';
import TownGameScene from './TownGameScene';

export default function TownMap(): JSX.Element {
  const coveyTownController = useTownController();
  const [gameArea, setGameArea] = useState<GameAreaController | null>(null);

  useEffect(() => {
    // coveyTownController
    //   .createGameArea({
    //     id: 'd',
    //     occupantsByID: [' '],
    //     gameRunning: false,
    //     spectatorsByID: [' '],
    //     board1: [[1], [1]],
    //     board2: [[1], [1]],
    //     player1ID: 'string',
    //     player2ID: 'string',
    //     dieRoll: 1,
    //     isItPlayerOneTurn: true,
    //   })
    //   .then(() => {
    //     console.log(coveyTownController.conversationAreas);
    //     console.log(coveyTownController.gameAreas);
    //     console.log(coveyTownController.gameAreas[0]);
    //     setGameArea(coveyTownController.gameAreas[0]);
    //   });
  }, [coveyTownController]);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: 'map-container',
      render: { pixelArt: true, powerPreference: 'high-performance' },
      scale: {
        expandParent: false,
        mode: Phaser.Scale.ScaleModes.WIDTH_CONTROLS_HEIGHT,
        autoRound: true,
      },
      width: 800,
      height: 600,
      fps: { target: 30 },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
    };

    const game = new Phaser.Game(config);
    const newGameScene = new TownGameScene(coveyTownController);
    game.scene.add('coveyBoard', newGameScene, true);
    const pauseListener = newGameScene.pause.bind(newGameScene);
    const unPauseListener = newGameScene.resume.bind(newGameScene);
    coveyTownController.addListener('pause', pauseListener);
    coveyTownController.addListener('unPause', unPauseListener);
    return () => {
      coveyTownController.removeListener('pause', pauseListener);
      coveyTownController.removeListener('unPause', unPauseListener);
      game.destroy(true);
    };
  }, [coveyTownController]);
  if (gameArea === null) {
    return <div>Loading...</div>;
  }
  console.log(gameArea);
  return (
    <div id='app-container'>
      <KnuckleModal currentGameArea={gameArea} />
      <NewConversationModal />
      <div id='map-container' />
      <div id='social-container'>
        <SocialSidebar />
      </div>
    </div>
  );
}
