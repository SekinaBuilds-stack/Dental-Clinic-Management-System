import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class GrnItemDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDateString()
  expiryDate: string;
}

export class CreateGrnDto {
  @IsString()
  @IsNotEmpty()
  grnNumber: string;

  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrnItemDto)
  items: GrnItemDto[];
}