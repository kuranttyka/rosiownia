import { describe, it, expect, vi } from 'vitest'
import { createActor, assign } from 'xstate'
import { catMachine, getWalkDirection } from '../components/catMachine'

describe('catMachine transitions', () => {
  it('transitions idle -> walking -> idle', async () => {
    const machine = catMachine.provide({
      actions: {
        pickIdleAnim: assign(() => ({
          animKey: 'Idle',
          stateTimer: 100000,
        })),
      },
      delays: {
        IDLE_DELAY: () => 999999,
      },
      guards: {
        shouldWalk: () => true,
        shouldSleep: () => false,
        shouldDance: () => false,
        shouldEat: () => false,
        shouldScratch: () => false,
        shouldBox: () => false,
        shouldLayDown: () => false,
      },
    })

    const idleSnapshot = machine.resolveState({
      value: 'idle',
      context: {
        x: 45,
        y: 55,
        targetX: 45,
        targetY: 55,
        animKey: 'Idle',
        facingRight: true,
        stateTimer: 3000,
      },
    })

    const actor = createActor(machine, { snapshot: idleSnapshot }).start()
    expect(actor.getSnapshot().value).toBe('idle')

    actor.send({ type: 'DECIDE' })
    await Promise.resolve()
    expect(actor.getSnapshot().value).toBe('walking')

    actor.send({ type: 'ARRIVED', x: 50, y: 50 })
    await Promise.resolve()
    expect(actor.getSnapshot().value).toBe('idle')
  })

  it('transitions to surprised on click', () => {
    const actor = createActor(catMachine).start()

    actor.send({ type: 'CLICK' })
    expect(actor.getSnapshot().value).toBe('surprised')
  })
})

describe('walk animation direction logic', () => {
  it('uses WalkRight when target is to the right', () => {
    const result = getWalkDirection(10, 20)
    expect(result.animKey).toBe('WalkRight')
    expect(result.facingRight).toBe(true)
  })

  it('uses WalkLeft when target is to the left or equal', () => {
    const result = getWalkDirection(20, 10)
    expect(result.animKey).toBe('WalkLeft')
    expect(result.facingRight).toBe(false)

    const equal = getWalkDirection(20, 20)
    expect(equal.animKey).toBe('WalkLeft')
    expect(equal.facingRight).toBe(false)
  })
})
