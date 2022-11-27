import Grid from '@material-ui/core/Grid';
import React from 'react';
import DieColumn from './DieColumn';

export default function DieBoard({ isPlayer }: { isPlayer: boolean }): JSX.Element {
  return (
    <div>
      <Grid container direction='row' justifyContent='space-evenly' alignItems='center'>
        <Grid item>
          <DieColumn columnNum={1} isPlayer={isPlayer} />
        </Grid>
        <Grid item>
          <DieColumn columnNum={2} isPlayer={isPlayer} />
        </Grid>
        <Grid item>
          <DieColumn columnNum={3} isPlayer={isPlayer} />
        </Grid>
      </Grid>
    </div>
  );
}
