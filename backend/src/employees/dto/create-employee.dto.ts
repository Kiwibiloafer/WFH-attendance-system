import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-003', description: 'Unique Employee Identification Number' })
  @IsString({ message: 'Employee number must be a string' })
  @IsNotEmpty({ message: 'Employee number is required' })
  @Transform(({ value }) => value?.trim())
  employeeNumber: string;

  @ApiProperty({ example: 'Andi Wijaya', description: 'Full legal name of the employee' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @ApiProperty({ example: 'andi.wijaya@dexa.com', description: 'Employee corporate email' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.trim()?.toLowerCase())
  email: string;

  @ApiProperty({ example: 'Human Resources', description: 'Assigned department' })
  @IsString({ message: 'Department must be a string' })
  @IsNotEmpty({ message: 'Department is required' })
  @Transform(({ value }) => value?.trim())
  department: string;

  @ApiPropertyOptional({ example: 'HR Specialist', description: 'Job position / title' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  position?: string;

  @ApiPropertyOptional({ example: '081234567891', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiProperty({ example: 'ChangeMe123!', description: 'Temporary password for initial login' })
  @IsString()
  @IsNotEmpty({ message: 'Temporary password is required' })
  @MinLength(6, { message: 'Temporary password must be at least 6 characters' })
  temporaryPassword: string;
}

