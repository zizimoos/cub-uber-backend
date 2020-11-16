import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurnatDto } from './create-restaurant.dto';

@InputType()
class UpdateRestaurnatInputType extends PartialType(CreateRestaurnatDto) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(() => Number)
  id: number;

  @Field(() => UpdateRestaurnatInputType)
  data: UpdateRestaurnatInputType;
}
