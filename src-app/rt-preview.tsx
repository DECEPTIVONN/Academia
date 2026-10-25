import { createRoot } from 'react-dom/client';
import '/src/styles/legacy.css';
import '/src/styles/globals.css';
import '/src/styles/design-tokens.css';
import { RestTimerWidget } from '@/features/workout/RestTimerWidget';
/* eslint-disable */
import { useWorkoutStore } from '@/store/workout-store';

const params = new URLSearchParams(location.search);
const style = params.get('style') || 'hourglass';
const remaining = Number(params.get('remaining') || '36');
const total = Number(params.get('total') || '60');

localStorage.setItem('timerStyle', style);
useWorkoutStore.setState({ isResting: true, restTimeRemaining: remaining, restTotalDuration: total });

createRoot(document.getElementById('root')!).render(<RestTimerWidget />);
