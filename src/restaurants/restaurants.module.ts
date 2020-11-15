import { Module } from '@nestjs/common';
import { RestaurnatResolver } from './restaurants.resolver';

@Module({
  providers: [RestaurnatResolver],
})
export class RestaurantsModule {}
