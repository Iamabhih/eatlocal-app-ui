import { describe, it, expect } from 'vitest';
import { getRefundStatusInfo, isOrderEligibleForRefund, REFUND_REASONS } from './useRefunds';

describe('Refund Utility Functions', () => {
  describe('getRefundStatusInfo', () => {
    it('returns correct info for pending status', () => {
      const info = getRefundStatusInfo('pending');
      expect(info.label).toBe('Pending Review');
      expect(info.color).toContain('yellow');
      expect(info.bgColor).toContain('yellow');
    });

    it('returns correct info for approved status', () => {
      const info = getRefundStatusInfo('approved');
      expect(info.label).toBe('Approved');
      expect(info.color).toContain('green');
    });

    it('returns correct info for rejected status', () => {
      const info = getRefundStatusInfo('rejected');
      expect(info.label).toBe('Rejected');
      expect(info.color).toContain('red');
    });

    it('returns correct info for processing status', () => {
      const info = getRefundStatusInfo('processing');
      expect(info.label).toBe('Processing');
      expect(info.color).toContain('blue');
    });

    it('returns correct info for completed status', () => {
      const info = getRefundStatusInfo('completed');
      expect(info.label).toBe('Completed');
      expect(info.color).toContain('gray');
    });

    it('handles unknown status gracefully', () => {
      // @ts-expect-error - Testing unknown status
      const info = getRefundStatusInfo('unknown_status');
      expect(info.label).toBe('unknown_status');
    });
  });

  describe('isOrderEligibleForRefund', () => {
    it('returns ineligible for pending orders', () => {
      const result = isOrderEligibleForRefund({
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('cancel');
    });

    it('returns ineligible for confirmed orders', () => {
      const result = isOrderEligibleForRefund({
        status: 'confirmed',
        created_at: new Date().toISOString(),
      });
      expect(result.eligible).toBe(false);
    });

    it('returns ineligible for preparing orders', () => {
      const result = isOrderEligibleForRefund({
        status: 'preparing',
        created_at: new Date().toISOString(),
      });
      expect(result.eligible).toBe(false);
    });

    it('returns eligible for delivered orders within window', () => {
      const result = isOrderEligibleForRefund({
        status: 'delivered',
        created_at: new Date().toISOString(),
      });
      expect(result.eligible).toBe(true);
    });

    it('returns ineligible for orders outside 7-day window', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      const result = isOrderEligibleForRefund({
        status: 'delivered',
        created_at: oldDate.toISOString(),
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('window');
    });

    it('returns eligible for cancelled orders within window', () => {
      const result = isOrderEligibleForRefund({
        status: 'cancelled',
        created_at: new Date().toISOString(),
      });
      expect(result.eligible).toBe(true);
    });
  });

  describe('REFUND_REASONS constant', () => {
    it('has all expected refund reasons', () => {
      expect(REFUND_REASONS).toHaveProperty('wrong_order');
      expect(REFUND_REASONS).toHaveProperty('missing_items');
      expect(REFUND_REASONS).toHaveProperty('quality_issue');
      expect(REFUND_REASONS).toHaveProperty('late_delivery');
      expect(REFUND_REASONS).toHaveProperty('never_received');
      expect(REFUND_REASONS).toHaveProperty('cancelled_by_restaurant');
      expect(REFUND_REASONS).toHaveProperty('other');
    });

    it('each reason has label and description', () => {
      Object.values(REFUND_REASONS).forEach((reason) => {
        expect(reason).toHaveProperty('label');
        expect(reason).toHaveProperty('description');
        expect(typeof reason.label).toBe('string');
        expect(typeof reason.description).toBe('string');
        expect(reason.label.length).toBeGreaterThan(0);
        expect(reason.description.length).toBeGreaterThan(0);
      });
    });
  });
});
