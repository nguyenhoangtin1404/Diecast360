import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class QueryMembersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
