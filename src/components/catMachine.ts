import { setup, assign } from 'xstate'

export interface CatContext {
  x: number // % position in room
  y: number // % position in room
  targetX: number
  targetY: number
  animKey: string
  facingRight: boolean
  stateTimer: number // how long to stay in current state (ms)
}

// Walkable area bounds (% of room container)
const WALK = { minX: 15, maxX: 75, minY: 35, maxY: 72 }

function randomTarget() {
  return {
    targetX: WALK.minX + Math.random() * (WALK.maxX - WALK.minX),
    targetY: WALK.minY + Math.random() * (WALK.maxY - WALK.minY),
  }
}

function randomDelay(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export const catMachine = setup({
  types: {
    context: {} as CatContext,
    events: {} as
      | { type: 'DECIDE' }
      | { type: 'ARRIVED' }
      | { type: 'WAKE' }
      | { type: 'CLICK' },
  },
  actions: {
    pickIdleAnim: assign(() => {
      const idleAnims = ['Idle', 'Idle', 'Sitting', 'Waiting', 'Sleepy']
      return {
        animKey: idleAnims[Math.floor(Math.random() * idleAnims.length)],
        stateTimer: randomDelay(3000, 6000),
      }
    }),
    pickWalkTarget: assign(({ context }) => {
      const t = randomTarget()
      return {
        ...t,
        facingRight: t.targetX > context.x,
        animKey: t.targetX > context.x ? 'WalkRight' : 'WalkLeft',
      }
    }),
    startSleep: assign(() => ({
      animKey: 'Sleep',
      stateTimer: randomDelay(6000, 12000),
    })),
    startLayDown: assign(() => ({
      animKey: 'LayDown',
      stateTimer: randomDelay(4000, 8000),
    })),
    startDance: assign(() => ({
      animKey: 'Dance',
      stateTimer: randomDelay(2000, 4000),
    })),
    startExcited: assign(() => ({
      animKey: 'Excited',
      stateTimer: randomDelay(2000, 3000),
    })),
    startScratching: assign(() => ({
      animKey: 'Scratching',
      stateTimer: randomDelay(2000, 4000),
    })),
    startEating: assign(() => ({
      animKey: 'EatingFull',
      stateTimer: randomDelay(3000, 5000),
    })),
    startSurprised: assign(() => ({
      animKey: 'Surprised',
      stateTimer: randomDelay(1000, 2000),
    })),
    startCry: assign(() => ({
      animKey: 'Cry',
      stateTimer: randomDelay(2000, 3000),
    })),
    startBox: assign(() => ({
      animKey: 'Box2',
      stateTimer: randomDelay(4000, 8000),
    })),
  },
  guards: {
    shouldWalk: () => Math.random() < 0.35,
    shouldSleep: () => Math.random() < 0.12,
    shouldDance: () => Math.random() < 0.1,
    shouldEat: () => Math.random() < 0.1,
    shouldScratch: () => Math.random() < 0.1,
    shouldBox: () => Math.random() < 0.08,
    shouldLayDown: () => Math.random() < 0.1,
  },
}).createMachine({
  id: 'yumaCat',
  initial: 'idle',
  context: {
    x: 45,
    y: 55,
    targetX: 45,
    targetY: 55,
    animKey: 'Idle',
    facingRight: true,
    stateTimer: 3000,
  },
  states: {
    idle: {
      entry: 'pickIdleAnim',
      after: {
        IDLE_DELAY: { target: 'deciding' },
      },
    },
    deciding: {
      always: [
        { guard: 'shouldWalk', target: 'walking', actions: 'pickWalkTarget' },
        { guard: 'shouldSleep', target: 'sleeping', actions: 'startSleep' },
        { guard: 'shouldDance', target: 'dancing', actions: 'startDance' },
        { guard: 'shouldEat', target: 'eating', actions: 'startEating' },
        { guard: 'shouldScratch', target: 'scratching', actions: 'startScratching' },
        { guard: 'shouldBox', target: 'inBox', actions: 'startBox' },
        { guard: 'shouldLayDown', target: 'layingDown', actions: 'startLayDown' },
        { target: 'idle' }, // fallback
      ],
    },
    walking: {
      on: {
        ARRIVED: { target: 'idle' },
      },
    },
    sleeping: {
      after: {
        SLEEP_DELAY: { target: 'idle' },
      },
    },
    dancing: {
      after: {
        ACTION_DELAY: { target: 'idle' },
      },
    },
    eating: {
      after: {
        ACTION_DELAY: { target: 'idle' },
      },
    },
    scratching: {
      after: {
        ACTION_DELAY: { target: 'idle' },
      },
    },
    inBox: {
      after: {
        ACTION_DELAY: { target: 'idle' },
      },
    },
    layingDown: {
      after: {
        ACTION_DELAY: { target: 'idle' },
      },
    },
    surprised: {
      after: {
        1500: { target: 'idle' },
      },
    },
  },
  on: {
    CLICK: { target: '.surprised', actions: 'startSurprised' },
  },
}, {
  delays: {
    IDLE_DELAY: ({ context }) => context.stateTimer,
    SLEEP_DELAY: ({ context }) => context.stateTimer,
    ACTION_DELAY: ({ context }) => context.stateTimer,
  },
})
