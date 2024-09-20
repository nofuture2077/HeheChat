import { EventType } from '@/commons/events';

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
            style.color = "light-dark(#520974, orange)";
        }
        if ((event.amount || 0) >= 10) {
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 20) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'cheer') {
        if ((event.amount || 0) >= 500) {
            style.color = "light-dark(#520974, orange)";
        }
        if ((event.amount || 0) >= 1000) {
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 5000) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'raid') {
        if ((event.amount || 0) >= 100) {
            style.color = "light-dark(#520974, orange)";
        }
        if ((event.amount || 0) >= 500) {
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 1000) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
}