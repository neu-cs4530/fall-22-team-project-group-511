//file containing the floating window for the knucklebones game
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import GameAreaController, { useGameAreaDie } from '../../../../classes/GameAreaController';
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import DieBoard from './DieBoard';
import DieComponent from './DieComponent';

const WIDTH = 100;
const HEIGHT = 100;

// type Cell = null | number;

//useEffect(() => {
//setKnucklePopup(true);
//}, []);

//takes in prop onDismiss so that parent can hide it
export default function KnuckleModal({
  currentGameArea,
}: {
  currentGameArea: GameAreaController;
}): JSX.Element {
  const knuckleGame = useInteractable('gameArea');
  const coveyTownController = useTownController();
  const currentPlayerID = coveyTownController.ourPlayer.id;

  const die = useGameAreaDie(currentGameArea);

  // coveyTownController.gameAreas.filter(area => {
  //   if (area.player1?.id == currentPlayerID) {
  //     const currentGameArea = area;
  //     // const board1 = useGameAreaBoard1(area);
  //     // const board2 = useGameAreaBoard2(area);
  //     // const die = useGameAreaDie(area);
  //   } else if (area.player2?.id == coveyTownController.ourPlayer.id) {
  //     const currentGameArea = area;
  //     // const die = useGameAreaDie(area);
  //   }
  // });

  const [rolledDie, setRolledDie] = useState(0);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    //started
    if (knuckleGame !== undefined) {
      setIsOpen(true);
      coveyTownController.pause();
    }
  }, [knuckleGame]);

  useEffect(() => {
    if (currentGameArea.die != undefined) {
      setRolledDie(currentGameArea.die);
    }
  }, [die]);

  const toast = useToast();

  // const onOpen = () => {
  //   toast({
  //     title: 'Knuckle Bones Started!',
  //     status: 'success',
  //   });
  //   // setIsOpen(true);
  // };

  const onClose = () => {
    if (knuckleGame) {
      coveyTownController.interactEnd(knuckleGame);
      coveyTownController.unPause();
    }
    setIsOpen(false);
  };

  const rollDie = () => {
    //call roll die function from the server then pull the value from the server and set it to rolledDie
    //emitgameupdate takes in a game controller
    // const gameController = coveyTownController.gameAreas[0];

    coveyTownController.interactableEmitter.emit('rollDie', currentPlayerID);

    // coveyTownController.emitGameUpdate(gameController);
    //now we need to get the value from the server
    // const die = coveyTownController.gameAreas[0].die;
    // if (die != undefined) {
    //   setRolledDie(die);
    // }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Knuckle Bones</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div>
              <DieBoard isPlayer={false} />
              <DieBoard isPlayer={true} />
              <h1>Rolled Die:</h1>
              <DieComponent dieNumber={rolledDie} />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={rollDie}>
              Roll Die
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// function Cell({ cell }: { cell: Cell }): JSX.Element {
//   return <div className='knucklePopup_cell'>{cell}</div>;
// }
