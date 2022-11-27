import Grid from '@material-ui/core/Grid';
import React from 'react';
import DieColumn from './DieColumn';

export default function DieBoard(): JSX.Element {
  return (
    <div>
      <h1>Board</h1>
      <Grid container direction='row' justifyContent='space-evenly' alignItems='center'>
        <Grid item>
          <DieColumn columnNum={1} />
        </Grid>
        <Grid item>
          <DieColumn columnNum={2} />
        </Grid>
        <Grid item>
          <DieColumn columnNum={3} />
        </Grid>
      </Grid>
    </div>
  );
}
