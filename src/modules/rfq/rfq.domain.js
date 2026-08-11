/**
 * Pure domain logic for RFQ and Quotes
 */
const AppError = require('../../utils/AppError');

const RFQ_STATES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  QUOTED: 'QUOTED',
  ACCEPTED: 'ACCEPTED',
  CONVERTED_TO_ORDER: 'CONVERTED_TO_ORDER',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

const QUOTE_STATES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const LEGAL_RFQ_TRANSITIONS = {
  [RFQ_STATES.DRAFT]: [RFQ_STATES.SUBMITTED],
  [RFQ_STATES.SUBMITTED]: [
    RFQ_STATES.UNDER_REVIEW,
    RFQ_STATES.QUOTED,
    RFQ_STATES.REJECTED,
    RFQ_STATES.CANCELLED
  ],
  [RFQ_STATES.UNDER_REVIEW]: [
    RFQ_STATES.QUOTED,
    RFQ_STATES.REJECTED,
    RFQ_STATES.CANCELLED
  ],
  [RFQ_STATES.QUOTED]: [
    RFQ_STATES.QUOTED, // Allow multiple quotes
    RFQ_STATES.ACCEPTED,
    RFQ_STATES.EXPIRED,
    RFQ_STATES.CANCELLED
  ],
  [RFQ_STATES.ACCEPTED]: [RFQ_STATES.CONVERTED_TO_ORDER],
  [RFQ_STATES.CONVERTED_TO_ORDER]: [],
  [RFQ_STATES.REJECTED]: [],
  [RFQ_STATES.CANCELLED]: []
};

const LEGAL_QUOTE_TRANSITIONS = {
  [QUOTE_STATES.DRAFT]: [QUOTE_STATES.SENT],
  [QUOTE_STATES.SENT]: [
    QUOTE_STATES.VIEWED,
    QUOTE_STATES.ACCEPTED,
    QUOTE_STATES.REJECTED,
    QUOTE_STATES.EXPIRED
  ],
  [QUOTE_STATES.VIEWED]: [
    QUOTE_STATES.ACCEPTED,
    QUOTE_STATES.REJECTED,
    QUOTE_STATES.EXPIRED
  ],
  [QUOTE_STATES.ACCEPTED]: [],
  [QUOTE_STATES.REJECTED]: [],
  [QUOTE_STATES.EXPIRED]: []
};

const validateRfqTransition = (currentState, nextState) => {
  const allowed = LEGAL_RFQ_TRANSITIONS[currentState];
  if (!allowed || !allowed.includes(nextState)) {
    throw new AppError(
      `Illegal state transition from ${currentState} to ${nextState}`,
      { code: 'INVALID_RFQ_STATE', statusCode: 400 }
    );
  }
};

const validateQuoteTransition = (currentState, nextState) => {
  const allowed = LEGAL_QUOTE_TRANSITIONS[currentState];
  if (!allowed || !allowed.includes(nextState)) {
    throw new AppError(
      `Illegal state transition from ${currentState} to ${nextState}`,
      { code: 'INVALID_QUOTE_STATE', statusCode: 400 }
    );
  }
};

module.exports = {
  RFQ_STATES,
  QUOTE_STATES,
  validateRfqTransition,
  validateQuoteTransition
};
