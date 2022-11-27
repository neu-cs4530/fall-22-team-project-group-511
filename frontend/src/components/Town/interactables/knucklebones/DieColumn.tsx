import { useToast } from '@chakra-ui/react';
import Grid from '@material-ui/core/Grid';
import React, { useEffect, useState } from 'react';
import DieComponent from './DieComponent';

export default function DieColumn({
  columnNum,
  isPlayer,
}: {
  columnNum: number;
  isPlayer: boolean;
}): JSX.Element {
  const toast = useToast();

  function columnPressedEvent() {
    toast({
      title: 'Column ' + columnNum + ' pressed',
    });
  }

  const [die1, setDie1] = useState(0);
  const [die2, setDie2] = useState(0);
  const [die3, setDie3] = useState(0);

  const [columnScore, setColumnScore] = useState(0);

  useEffect(() => {
    const score = die1 + die2 + die3;
    setColumnScore(score);
  }, [die1, die2, die3]);

  return (
    <div onClick={columnPressedEvent}>
      <Grid container direction='column' justifyContent='space-evenly' alignItems='center'>
        {isPlayer ? (
          <Grid item>
            <h1>{columnScore}</h1>
          </Grid>
        ) : (
          <></>
        )}
        <Grid item>
          <DieComponent dieNumber={die1} />
        </Grid>
        <Grid item>
          <DieComponent dieNumber={die2} />
        </Grid>
        <Grid item>
          <DieComponent dieNumber={die3} />
        </Grid>
        {!isPlayer ? (
          <Grid item>
            <h1>{columnScore}</h1>
          </Grid>
        ) : (
          <></>
        )}
      </Grid>
    </div>
  );
}
