import { SystemMessage } from "./Chat";
import { Text } from "@mantine/core"
import classes from './systemmessage.module.css';

export function SystemMessageComp(props: {msg: SystemMessage} ) {
    const p = props.msg.subType === 'raid' ? {variant: 'gradient', gradient: { from: 'cyan', to: 'orange', deg: 0 }} : {};
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}><Text fw={500} {...p}>{props.msg.text}</Text></div>;
}