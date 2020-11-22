import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurnatResolver } from './restaurants.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [RestaurnatResolver, RestaurantService],
})
export class RestaurantsModule {}
