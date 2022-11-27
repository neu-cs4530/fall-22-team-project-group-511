import React from 'react';
import FiveDie from './images/dice_five.png';
import FourDie from './images/dice_four.png';
import OneDie from './images/dice_one.png';
import SixDie from './images/dice_six.png';
import ThreeDie from './images/dice_three.png';
import TwoDie from './images/dice_two.png';

export default function DieComponent({ dieNumber }: { dieNumber: number }): JSX.Element {
  function renderDie(num: number) {
    switch (num) {
      case 1:
        return <img src={OneDie} />;
      case 2:
        return <img src={TwoDie} />;
      case 3:
        return <img src={ThreeDie} />;
      case 4:
        return <img src={FourDie} />;
      case 5:
        return <img src={FiveDie} />;
      case 6:
        return <img src={SixDie} />;
    }
  }

  return <div>{renderDie(dieNumber)}</div>;
}
