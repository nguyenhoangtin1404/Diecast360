import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';

export type PointsMutationType = 'earn' | 'redeem' | 'adjust';

export type ApplyPointsInput = {
  currentBalance: number;
  type: PointsMutationType;
  points: number;
};

export type ApplyPointsResult = {
  delta: number;
  nextBalance: number;
};

export function applyPointsMutation(input: ApplyPointsInput): ApplyPointsResult {
  if (!Number.isInteger(input.currentBalance) || input.currentBalance < 0) {
    throw new AppException(ErrorCode.VALIDATION_ERROR, 'Current points balance must be a non-negative integer.');
  }
  if (!Number.isInteger(input.points)) {
    throw new AppException(ErrorCode.VALIDATION_ERROR, 'Points must be an integer.');
  }

  if (input.type === 'adjust') {
    if (input.points === 0) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Adjust points must be non-zero.');
    }
    const nextBalanceForAdjust = input.currentBalance + input.points;
    if (nextBalanceForAdjust < 0) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        `Points operation would result in negative balance (${nextBalanceForAdjust}).`,
      );
    }
    return { delta: input.points, nextBalance: nextBalanceForAdjust };
  }
  if (input.points <= 0) {
    throw new AppException(ErrorCode.VALIDATION_ERROR, 'Points must be a positive integer.');
  }

  const delta = input.type === 'redeem' ? -input.points : input.points;
  const nextBalance = input.currentBalance + delta;
  if (nextBalance < 0) {
    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      `Points operation would result in negative balance (${nextBalance}).`,
    );
  }

  return { delta, nextBalance };
}
