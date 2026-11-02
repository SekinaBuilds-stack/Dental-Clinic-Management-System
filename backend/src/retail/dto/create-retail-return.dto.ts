import { IsString, IsNumber, Min } from 'class-validator';

export class CreateRetailReturnDto {
  @IsString()
  retailSaleId: string;

  @IsString()
  retailProductId: string;

  @IsNumber()
  @Min(1)
  returnQuantity: number;

  @IsString()
  reason: string;
}