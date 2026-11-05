import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Andi Wijaya, S.Kom', description: 'Updated full name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @ApiPropertyOptional({ example: 'Human Resources', description: 'Updated department' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  department?: string;

  @ApiPropertyOptional({ example: 'Senior HR Specialist', description: 'Updated position' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  position?: string;

  @ApiPropertyOptional({ example: '081234567899', description: 'Updated phone number' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  phone?: string;
}

