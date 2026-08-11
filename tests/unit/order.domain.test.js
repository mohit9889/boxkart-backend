const { validateTransition, ORDER_STATES } = require('../../src/modules/order/order.domain');

describe('Order State Machine', () => {
  it('should allow valid transitions', () => {
    expect(() => validateTransition(ORDER_STATES.PENDING, ORDER_STATES.CONFIRMED)).not.toThrow();
    expect(() => validateTransition(ORDER_STATES.CONFIRMED, ORDER_STATES.PROCESSING)).not.toThrow();
    expect(() => validateTransition(ORDER_STATES.READY_TO_SHIP, ORDER_STATES.SHIPPED)).not.toThrow();
    expect(() => validateTransition(ORDER_STATES.SHIPPED, ORDER_STATES.DELIVERED)).not.toThrow();
  });

  it('should prevent invalid transitions', () => {
    expect(() => validateTransition(ORDER_STATES.DELIVERED, ORDER_STATES.PENDING)).toThrow(/Cannot transition/);
    expect(() => validateTransition(ORDER_STATES.PENDING, ORDER_STATES.SHIPPED)).toThrow(/Cannot transition/);
    expect(() => validateTransition(ORDER_STATES.CANCELLED, ORDER_STATES.CONFIRMED)).toThrow(/Cannot transition/);
  });

  it('should throw on unknown states', () => {
    expect(() => validateTransition('UNKNOWN_STATE', ORDER_STATES.PENDING)).toThrow(/Unknown state/);
  });
});
