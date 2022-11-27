import Grid from '@material-ui/core/Grid';
import React from 'react';
import DieComponent from './DieComponent';

export default function DieColumn({ columnNum }: { columnNum: number }): JSX.Element {
  return (
    <div>
      <h1>Column {columnNum}</h1>
      <Grid container direction='column' justifyContent='space-evenly' alignItems='center'>
        <Grid item>
          <DieComponent dieNumber={1} />
        </Grid>
        <Grid item>
          <DieComponent dieNumber={2} />
        </Grid>
        <Grid item>
          <DieComponent dieNumber={3} />
        </Grid>
      </Grid>
    </div>
  );
}
