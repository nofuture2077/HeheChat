import { EventType } from '@/commons/events';

export function getEventStyle(event: {eventtype: EventType, amount?: number}, style: any) {
    if (event.eventtype.startsWith('subgift_')) {
        if ((event.amount || 0) >= 5) {
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >= 10) {
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 20) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'cheer') {
        if ((event.amount || 0) >= 500) {
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >= 1000) {
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 5000) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'raid') {
        if ((event.amount || 0) >= 100) {
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >= 500) {
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 1000) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
}