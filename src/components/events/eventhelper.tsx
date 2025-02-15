import { EventType } from '@/commons/events';

// #EABFCB mod events
// #EAEFD3 stream events
// #B3C0A4 dono

export function getEventStyle(event: {eventtype: EventType, amount?: number}, style: any) {
    style.color = "light-dark(black, white)"
    style.variant = 'subtle';
    if (event.eventtype.startsWith('sub_2000')) {
        style.color = 'cyan';
    }
    if (event.eventtype.startsWith('sub_3000')) {
        style.color = 'orange';
}
    if (event.eventtype.startsWith('subgift_')) {
        if ((event.amount || 0) >= 5) {
            style.color = "light-dark(#520974, #fffe52)";
        }
        if ((event.amount || 0) >= 10) {
            style.color = "light-dark(#52ecff, #52ecff)";
        }
        if ((event.amount || 0) >= 20) {
            style.variant = 'gradient';
            style.gradient = { from: '#DB32BC', to: '#ff1493', deg: 45 };
        }
    }
    if (event.eventtype === 'cheer') {
        if ((event.amount || 0) >= 500) {
            style.color = "light-dark(rgb(229, 82, 255),rgb(229, 82, 255))";
        }
        if ((event.amount || 0) >= 1000) {
            style.color = "light-dark(#52ecff, #52ecff)";
        }
        if ((event.amount || 0) >= 5000) {
            style.variant = 'gradient';
            style.gradient = { from: '#52ecff', to: 'rgb(229, 82, 255)', deg: 45 };
        }
    }
    if (event.eventtype === 'raid') {
        if ((event.amount || 0) >= 100) {
            style.color = "light-dark(#520974, #fffe52)";
        }
        if ((event.amount || 0) >= 500) {
            style.color = "light-dark(#52ecff, #52ecff)";
        }
        if ((event.amount || 0) >= 1000) {
            style.variant = 'gradient';
            style.gradient = { from: '#fffe52', to: '#52ecff', deg: 45 };
        }
    }
}