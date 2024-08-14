import { SegmentedControl } from '@mantine/core';
import classes from './GradientSegmentedControl.module.css';

export function GradientSegmentedControl(props: {data: { label: string, value: string }[], value: string, setValue: (val: string) => void}) {
    return (
    <SegmentedControl
      radius="xl"
      size="md"
      value={props.value}
      onChange={props.setValue}
      data={props.data}
      classNames={classes}
    />
  );
}