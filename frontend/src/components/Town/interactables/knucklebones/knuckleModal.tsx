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
export default function KnuckleModal(): JSX.Element {
  const knuckleGame = useInteractable('gameArea');
  const coveyTownController = useTownController();

  // coveyTownController.gameAreas.filter(area => {
  //   if (area.player1?.id == coveyTownController.ourPlayer.id) {
  //     const currentGameArea = area;
  //     const board1 = useGameAreaBoard1(area);
  //     const board2 = useGameAreaBoard2(area);
  //     const die = useGameAreaDie(area);
  //   } else if (area.player2?.id == coveyTownController.ourPlayer.id) {
  //     const currentGameArea = area;
  //     const die = useGameAreaDie(area);
  //   }
  // });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    //started
    if (knuckleGame !== undefined) {
      setIsOpen(true);
      coveyTownController.pause();
    }
  }, [knuckleGame]);

  // useEffect(() => {
  //   setDie()
  // },[die]);

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

  const [rolledDie, setRolledDie] = useState(0);

  const rollDie = () => {
    // DieBoard.
    const rand = Math.floor(Math.random() * 6) + 1;
    setRolledDie(rand);
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
