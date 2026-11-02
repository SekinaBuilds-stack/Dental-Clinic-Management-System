import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
  @IsString()
  retailProductId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateRetailSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsString()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  patientId?: string;
}