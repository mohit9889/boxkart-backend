/**
 * Pure domain logic for Order State Machine
 */

const ORDER_STATES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

const LEGAL_TRANSITIONS = {
  [ORDER_STATES.PENDING]: [
    ORDER_STATES.CONFIRMED,
    ORDER_STATES.FAILED,
    ORDER_STATES.CANCELLED
  ],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.READY_TO_SHIP],
  [ORDER_STATES.READY_TO_SHIP]: [ORDER_STATES.SHIPPED],
  [ORDER_STATES.SHIPPED]: [ORDER_STATES.DELIVERED],
  [ORDER_STATES.DELIVERED]: [], // Terminal state
  [ORDER_STATES.CANCELLED]: [], // Terminal state
  [ORDER_STATES.FAILED]: [] // Terminal state
};

const validateTransition = (currentState, targetState) => {
  const allowed = LEGAL_TRANSITIONS[currentState];
  if (!allowed) {
    throw new Error(`Unknown state: ${currentState}`);
  }

  if (!allowed.includes(targetState)) {
    throw new Error(
      `Illegal state transition from ${currentState} to ${targetState}`
    );
  }

  return true;
};

module.exports = {
  ORDER_STATES,
  LEGAL_TRANSITIONS,
  validateTransition
};
