import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

// FR-PAY-002
export class CreatePaymentDto {
  @IsString() @IsNotEmpty()
  billId: string;

  @IsNumber() @IsPositive()
  amount: number;

  @IsString() @IsNotEmpty()
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY, INSURANCE

  @IsOptional() @IsString()
  transactionReference?: string;

  @IsOptional() @IsString()
  cashierId?: string;
}

// FR-PAY-003
export class ReversePaymentDto {
  @IsString() @IsNotEmpty()
  reason: string;

  @IsOptional() @IsString()
  managerId?: string;
}

// FR-PAY-004
export class SubmitClaimDto {
  @IsString() @IsNotEmpty()
  patientId: string;

  @IsString() @IsNotEmpty()
  insuranceProvider: string;

  @IsString() @IsNotEmpty()
  policyNumber: string;

  /** Total amount being claimed for the treatment (before the patient's co-pay is split off). */
  @IsNumber() @IsPositive()
  claimAmount: number;

  /** Optional: looked up from the stored policy when omitted. */
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  coveragePercent?: number;
}

// FR-PAY-005
export class UpdateClaimStatusDto {
  @IsString() @IsNotEmpty()
  status: string; // SUBMITTED, APPROVED, REJECTED, PAID
}

// FR-PAY-006
export class CopayDto {
  @IsNumber() @Min(0)
  totalAmount: number;

  @IsNumber() @Min(0) @Max(100)
  coveragePercent: number;
}

// FR-PAY-007
export class CreatePaymentPlanDto {
  @IsString() @IsNotEmpty()
  patientId: string;

  @IsString() @IsNotEmpty()
  billId: string;

  @IsNumber() @IsPositive()
  totalAmount: number;

  @IsInt() @Min(2)
  installmentsCount: number;
}
